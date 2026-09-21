import type { ItemFeedAdmin, ResultadoAnalisisUrl, TipoFeed } from "./contenido-feed.types";
import { ServicioMetadatos } from "../../dashboard/services/metadatos.service";
import { clienteSupabase } from "../../../lib/supabase";

interface RegistroContenidoFeedSupabase {
  id: string;
  tipo: TipoFeed;
  enlace: string;
  titulo: string;
  descripcion: string | null;
  imagen: string | null;
  fuente_o_canal: string | null;
  fecha_publicacion: string | null;
  categoria: string | null;
  duracion_o_lectura: string | null;
  estado: "Publicado" | "Borrador";
  destacado?: boolean | null;
  likes_count?: number | null;
  dislikes_count?: number | null;
  created_at: string;
}

/**
 * Servicio encargado de la gestión de contenidos Feed (Noticias y YouTube)
 */
export class ServicioContenidoFeed {
  /**
   * Mapea un registro de Supabase al formato de la aplicación
   */
  private static mapearRegistro(registro: RegistroContenidoFeedSupabase): ItemFeedAdmin {
    return {
      id: registro.id,
      tipo: registro.tipo,
      enlace: registro.enlace,
      titulo: registro.titulo,
      descripcion: registro.descripcion || "",
      imagen: registro.imagen || undefined,
      fuenteOCanal: registro.fuente_o_canal || undefined,
      fechaPublicacion: registro.fecha_publicacion || undefined,
      categoria: registro.categoria || undefined,
      duracionOLectura: registro.duracion_o_lectura || undefined,
      estado: registro.estado,
      destacado: Boolean(registro.destacado),
      likesCount: Number(registro.likes_count) || 0,
      dislikesCount: Number(registro.dislikes_count) || 0,
    };
  }

  /**
   * Obtiene todos los contenidos de Feed reales registrados en Supabase
   */
  static async obtenerItems(): Promise<ItemFeedAdmin[]> {
    try {
      const registros = await clienteSupabase.consultar<RegistroContenidoFeedSupabase>(
        "contenido_feed",
        "select=*&order=created_at.desc"
      );

      if (registros && registros.length > 0) {
        return registros.map(this.mapearRegistro);
      }
    } catch (error) {
      console.error("Error al obtener items de contenido feed desde Supabase:", error);
    }

    return [];
  }

  /**
   * Obtiene un elemento por ID
   */
  static async obtenerItemPorId(id: string): Promise<ItemFeedAdmin | null> {
    try {
      const registros = await clienteSupabase.consultar<RegistroContenidoFeedSupabase>(
        "contenido_feed",
        `id=eq.${id}&select=*`
      );

      if (registros && registros.length > 0) {
        return this.mapearRegistro(registros[0]);
      }
    } catch (error) {
      console.error(`Error al obtener contenido feed con ID ${id}:`, error);
    }
    return null;
  }

  /**
   * Crea un nuevo contenido feed
   */
  static async crearItem(datos: Omit<ItemFeedAdmin, "id">): Promise<ItemFeedAdmin> {
    const registroInsertado = await clienteSupabase.insertar<RegistroContenidoFeedSupabase>(
      "contenido_feed",
      {
        tipo: datos.tipo,
        enlace: datos.enlace,
        titulo: datos.titulo,
        descripcion: datos.descripcion || null,
        imagen: datos.imagen || null,
        fuente_o_canal: datos.fuenteOCanal || null,
        fecha_publicacion: datos.fechaPublicacion || new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
        categoria: datos.categoria || null,
        duracion_o_lectura: datos.duracionOLectura || null,
        estado: datos.estado || "Publicado",
        destacado: Boolean(datos.destacado),
      }
    );

    return this.mapearRegistro(registroInsertado);
  }

  /**
   * Actualiza un contenido feed existente
   */
  static async actualizarItem(id: string, datos: Partial<Omit<ItemFeedAdmin, "id">>): Promise<ItemFeedAdmin> {
    const cuerpoActualizacion: Record<string, unknown> = {};

    if (datos.tipo !== undefined) cuerpoActualizacion.tipo = datos.tipo;
    if (datos.enlace !== undefined) cuerpoActualizacion.enlace = datos.enlace;
    if (datos.titulo !== undefined) cuerpoActualizacion.titulo = datos.titulo;
    if (datos.descripcion !== undefined) cuerpoActualizacion.descripcion = datos.descripcion;
    if (datos.imagen !== undefined) cuerpoActualizacion.imagen = datos.imagen;
    if (datos.fuenteOCanal !== undefined) cuerpoActualizacion.fuente_o_canal = datos.fuenteOCanal;
    if (datos.fechaPublicacion !== undefined) cuerpoActualizacion.fecha_publicacion = datos.fechaPublicacion;
    if (datos.categoria !== undefined) cuerpoActualizacion.categoria = datos.categoria;
    if (datos.duracionOLectura !== undefined) cuerpoActualizacion.duracion_o_lectura = datos.duracionOLectura;
    if (datos.estado !== undefined) cuerpoActualizacion.estado = datos.estado;
    if (datos.destacado !== undefined) cuerpoActualizacion.destacado = datos.destacado;

    const registroActualizado = await clienteSupabase.actualizar<RegistroContenidoFeedSupabase>(
      "contenido_feed",
      id,
      cuerpoActualizacion
    );

    if (!registroActualizado) {
      throw new Error(`No se encontró el contenido feed con ID ${id}`);
    }

    return this.mapearRegistro(registroActualizado);
  }

  /**
   * Establece un contenido como destacado de forma exclusiva para su tipo (noticia o youtube)
   * Garantiza que solo exista máximo 1 destacado por sección.
   */
  static async establecerDestacado(id: string, tipo: TipoFeed, nuevoDestacado: boolean): Promise<boolean> {
    try {
      if (nuevoDestacado) {
        // 1. Buscar y desmarcar otros destacados del mismo tipo
        const destacadosPrevios = await clienteSupabase.consultar<RegistroContenidoFeedSupabase>(
          "contenido_feed",
          `tipo=eq.${tipo}&destacado=eq.true&select=id`
        );

        if (destacadosPrevios && destacadosPrevios.length > 0) {
          for (const prev of destacadosPrevios) {
            if (prev.id !== id) {
              await clienteSupabase.actualizar("contenido_feed", prev.id, { destacado: false });
            }
          }
        }
      }

      // 2. Actualizar el registro seleccionado
      await clienteSupabase.actualizar("contenido_feed", id, { destacado: nuevoDestacado });
      clienteSupabase.limpiarCache("contenido_feed");
      return true;
    } catch (error) {
      console.error(`Error al establecer destacado en contenido feed con ID ${id}:`, error);
      return false;
    }
  }

  /**
   * Elimina un contenido feed por ID
   */
  static async eliminarItem(id: string): Promise<boolean> {
    return await clienteSupabase.eliminar("contenido_feed", id);
  }

  /**
   * Elimina múltiples contenidos feed por sus IDs
   */
  static async eliminarItemsMultiples(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    return await clienteSupabase.eliminarMasivo("contenido_feed", ids);
  }

  /**
   * Analiza una URL (YouTube o Noticia) extrayendo sus metadatos reales
   */
  static async analizarUrl(url: string): Promise<ResultadoAnalisisUrl> {
    const esYoutube =
      url.includes("youtube.com") || url.includes("youtu.be");

    if (esYoutube) {
      const meta = await ServicioMetadatos.extraerMetadatosYoutube(url);
      return {
        tipo: "youtube",
        enlace: url,
        titulo: meta.titulo,
        descripcion: `Contenido audiovisual publicado por ${meta.canal}.`,
        imagen: meta.imagenMiniatura,
        fuenteOCanal: meta.canal,
        fechaPublicacion: new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
        categoria: "Audiovisual",
        duracionOLectura: "Video",
      };
    } else {
      const meta = await ServicioMetadatos.extraerMetadatos(url);
      const palabras = `${meta.titulo} ${meta.descripcion}`.split(/\s+/).length;
      const minutos = Math.max(3, Math.ceil(palabras / 30));

      return {
        tipo: "noticia",
        enlace: url,
        titulo: meta.titulo,
        descripcion: meta.descripcion,
        imagen: meta.imagen,
        fuenteOCanal: meta.sitio,
        fechaPublicacion: meta.fechaPublicacion || new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }),
        categoria: "Actualidad",
        duracionOLectura: `${minutos} min de lectura`,
      };
    }
  }
}
