/**
 * Configuración y cliente ligero de conexión a Supabase con caché en memoria de alta velocidad
 */

const SUPABASE_URL =
  import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const cabecerasBase = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  "Content-Type": "application/json",
};

// Caché en memoria para respuestas SSR instantáneas
interface EntradaCache {
  datos: any;
  expiraEn: number;
}
const cacheMemoria = new Map<string, EntradaCache>();
const TTL_CACHE_MS = 20_000; // 20 segundos de caché fresca

export const clienteSupabase = {
  /**
   * Limpia la caché en memoria para una tabla específica o todo
   */
  limpiarCache(tabla?: string) {
    if (tabla) {
      for (const clave of cacheMemoria.keys()) {
        if (clave.startsWith(`${tabla}:`)) {
          cacheMemoria.delete(clave);
        }
      }
    } else {
      cacheMemoria.clear();
    }
  },

  /**
   * Realiza una consulta GET a una tabla de Supabase con aceleración por caché
   */
  async consultar<T>(tabla: string, queryParams: string = "", forzarFresco: boolean = false): Promise<T[]> {
    const claveCache = `${tabla}:${queryParams}`;
    const ahora = Date.now();

    if (!forzarFresco && cacheMemoria.has(claveCache)) {
      const entrada = cacheMemoria.get(claveCache)!;
      if (ahora < entrada.expiraEn) {
        return structuredClone(entrada.datos) as T[];
      }
      cacheMemoria.delete(claveCache);
    }

    const url = `${SUPABASE_URL}/rest/v1/${tabla}${queryParams ? `?${queryParams}` : ""}`;
    const respuesta = await fetch(url, {
      method: "GET",
      headers: cabecerasBase,
    });

    if (!respuesta.ok) {
      const errorDetalle = await respuesta.text();
      throw new Error(`Error al consultar ${tabla}: ${respuesta.status} - ${errorDetalle}`);
    }

    const datos = await respuesta.json();
    cacheMemoria.set(claveCache, {
      datos,
      expiraEn: ahora + TTL_CACHE_MS,
    });

    return datos as T[];
  },

  /**
   * Inserta un nuevo registro en una tabla
   */
  async insertar<T>(tabla: string, datos: Record<string, any>): Promise<T> {
    this.limpiarCache(tabla);
    const url = `${SUPABASE_URL}/rest/v1/${tabla}`;
    const respuesta = await fetch(url, {
      method: "POST",
      headers: {
        ...cabecerasBase,
        Prefer: "return=representation",
      },
      body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
      const errorDetalle = await respuesta.text();
      throw new Error(`Error al insertar en ${tabla}: ${respuesta.status} - ${errorDetalle}`);
    }

    const resultado = await respuesta.json();
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },

  /**
   * Actualiza un registro por ID
   */
  async actualizar<T>(tabla: string, id: string, datos: Record<string, any>): Promise<T> {
    this.limpiarCache(tabla);
    const url = `${SUPABASE_URL}/rest/v1/${tabla}?id=eq.${id}`;
    const respuesta = await fetch(url, {
      method: "PATCH",
      headers: {
        ...cabecerasBase,
        Prefer: "return=representation",
      },
      body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
      const errorDetalle = await respuesta.text();
      throw new Error(`Error al actualizar en ${tabla}: ${respuesta.status} - ${errorDetalle}`);
    }

    const resultado = await respuesta.json();
    return Array.isArray(resultado) ? resultado[0] : resultado;
  },

  /**
   * Elimina un registro por ID
   */
  async eliminar(tabla: string, id: string): Promise<boolean> {
    this.limpiarCache(tabla);
    const url = `${SUPABASE_URL}/rest/v1/${tabla}?id=eq.${id}`;
    const respuesta = await fetch(url, {
      method: "DELETE",
      headers: cabecerasBase,
    });

    if (!respuesta.ok) {
      const errorDetalle = await respuesta.text();
      throw new Error(`Error al eliminar de ${tabla}: ${respuesta.status} - ${errorDetalle}`);
    }

    return true;
  },

  /**
   * Elimina múltiples registros por IDs
   */
  async eliminarMasivo(tabla: string, ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    this.limpiarCache(tabla);
    const idsFormateados = ids.map((id) => `"${id}"`).join(",");
    const url = `${SUPABASE_URL}/rest/v1/${tabla}?id=in.(${idsFormateados})`;
    const respuesta = await fetch(url, {
      method: "DELETE",
      headers: cabecerasBase,
    });

    if (!respuesta.ok) {
      const errorDetalle = await respuesta.text();
      throw new Error(`Error en eliminación masiva de ${tabla}: ${respuesta.status} - ${errorDetalle}`);
    }

    return true;
  },
};
