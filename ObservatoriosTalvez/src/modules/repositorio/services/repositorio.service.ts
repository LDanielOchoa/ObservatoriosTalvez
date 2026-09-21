import type { DocumentoRepositorio } from "./repositorio.types";
import { clienteSupabase } from "../../../lib/supabase";

interface RegistroDocumentoSupabase {
  id: string;
  ano: string;
  linea_investigacion: string;
  titulo: string;
  tipo_fuente: string;
  pais: string;
  categoria?: string | null;
  autores: string[];
  enlace_documento: string | null;
  paginas_web?: string[] | null;
  resumen: string | null;
  referencia_apa: string | null;
  paginas: number | null;
  likes_count?: number | null;
  dislikes_count?: number | null;
  created_at: string;
}

/**
 * Servicio encargado de gestionar los documentos del Repositorio con Supabase
 */
export class ServicioRepositorio {
  /**
   * Mapea un registro de Supabase al tipo de la aplicación
   */
  private static mapearRegistro(registro: RegistroDocumentoSupabase): DocumentoRepositorio {
    // Parsear páginas web múltiples
    let paginasWeb: string[] = [];
    if (Array.isArray(registro.paginas_web) && registro.paginas_web.length > 0) {
      paginasWeb = registro.paginas_web;
    } else if (registro.enlace_documento) {
      const raw = registro.enlace_documento.trim();
      if (raw.startsWith("[") && raw.endsWith("]")) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            paginasWeb = parsed.map(String).filter(Boolean);
          }
        } catch {
          paginasWeb = [raw];
        }
      } else {
        paginasWeb = [raw];
      }
    }

    const primerEnlace = paginasWeb.length > 0 ? paginasWeb[0] : (registro.enlace_documento || undefined);

    return {
      id: registro.id,
      ano: registro.ano,
      lineaInvestigacion: registro.linea_investigacion,
      titulo: registro.titulo,
      tipoFuente: registro.tipo_fuente,
      pais: registro.pais,
      categoria: registro.categoria || undefined,
      autores: Array.isArray(registro.autores) ? registro.autores : [],
      enlaceDocumento: primerEnlace,
      paginasWeb,
      resumen: registro.resumen || undefined,
      referenciaApa: registro.referencia_apa || undefined,
      paginas: registro.paginas || undefined,
      likesCount: Number(registro.likes_count) || 0,
      dislikesCount: Number(registro.dislikes_count) || 0,
      createdAt: registro.created_at,

    };
  }

  /**
   * Obtiene todos los documentos reales registrados en Supabase
   */
  static async obtenerDocumentos(): Promise<DocumentoRepositorio[]> {
    try {
      const registros = await clienteSupabase.consultar<RegistroDocumentoSupabase>(
        "documentos_repositorio",
        "select=*&order=created_at.desc"
      );

      if (registros && registros.length > 0) {
        return registros.map(this.mapearRegistro);
      }
    } catch (error) {
      console.error("Error al obtener documentos del repositorio desde Supabase:", error);
    }
    return [];
  }

  /**
   * Obtiene un documento por su ID
   */
  static async obtenerDocumentoPorId(id: string): Promise<DocumentoRepositorio | null> {
    try {
      const registros = await clienteSupabase.consultar<RegistroDocumentoSupabase>(
        "documentos_repositorio",
        `id=eq.${id}&select=*`
      );

      if (registros && registros.length > 0) {
        return this.mapearRegistro(registros[0]);
      }
    } catch (error) {
      console.error(`Error al obtener documento de repositorio con ID ${id}:`, error);
    }
    return null;
  }

  /**
   * Serializa páginas web para almacenamiento
   */
  private static serializarEnlaces(paginasWeb?: string[], enlaceDocumento?: string): string | null {
    if (Array.isArray(paginasWeb) && paginasWeb.length > 0) {
      if (paginasWeb.length === 1) {
        return paginasWeb[0];
      }
      return JSON.stringify(paginasWeb);
    }
    return enlaceDocumento || null;
  }

  /**
   * Crea un nuevo documento en el repositorio
   */
  static async crearDocumento(datos: Omit<DocumentoRepositorio, "id" | "createdAt">): Promise<DocumentoRepositorio> {
    const enlaceSerializado = this.serializarEnlaces(datos.paginasWeb, datos.enlaceDocumento);

    const registroInsertado = await clienteSupabase.insertar<RegistroDocumentoSupabase>(
      "documentos_repositorio",
      {
        ano: datos.ano,
        linea_investigacion: datos.lineaInvestigacion,
        titulo: datos.titulo,
        tipo_fuente: datos.tipoFuente,
        pais: datos.pais,
        categoria: datos.categoria || null,
        autores: datos.autores || [],
        enlace_documento: enlaceSerializado,
        resumen: datos.resumen || null,
        referencia_apa: datos.referenciaApa || null,
        paginas: datos.paginas || null,
      }
    );

    return this.mapearRegistro(registroInsertado);
  }

  /**
   * Actualiza un documento del repositorio existente
   */
  static async actualizarDocumento(
    id: string,
    datos: Partial<Omit<DocumentoRepositorio, "id" | "createdAt">>
  ): Promise<DocumentoRepositorio> {
    const cuerpoActualizacion: Record<string, unknown> = {};

    if (datos.ano !== undefined) cuerpoActualizacion.ano = datos.ano;
    if (datos.lineaInvestigacion !== undefined) cuerpoActualizacion.linea_investigacion = datos.lineaInvestigacion;
    if (datos.titulo !== undefined) cuerpoActualizacion.titulo = datos.titulo;
    if (datos.tipoFuente !== undefined) cuerpoActualizacion.tipo_fuente = datos.tipoFuente;
    if (datos.pais !== undefined) cuerpoActualizacion.pais = datos.pais;
    if (datos.categoria !== undefined) cuerpoActualizacion.categoria = datos.categoria;
    if (datos.autores !== undefined) cuerpoActualizacion.autores = datos.autores;

    if (datos.paginasWeb !== undefined || datos.enlaceDocumento !== undefined) {
      cuerpoActualizacion.enlace_documento = this.serializarEnlaces(datos.paginasWeb, datos.enlaceDocumento);
    }

    if (datos.resumen !== undefined) cuerpoActualizacion.resumen = datos.resumen;
    if (datos.referenciaApa !== undefined) cuerpoActualizacion.referencia_apa = datos.referenciaApa;
    if (datos.paginas !== undefined) cuerpoActualizacion.paginas = datos.paginas;

    const registroActualizado = await clienteSupabase.actualizar<RegistroDocumentoSupabase>(
      "documentos_repositorio",
      id,
      cuerpoActualizacion
    );

    if (!registroActualizado) {
      throw new Error(`No se encontró el documento con ID ${id}`);
    }

    return this.mapearRegistro(registroActualizado);
  }

  /**
   * Elimina un documento por su ID
   */
  static async eliminarDocumento(id: string): Promise<boolean> {
    return await clienteSupabase.eliminar("documentos_repositorio", id);
  }

  /**
   * Elimina múltiples documentos por sus IDs
   */
  static async eliminarDocumentosMasivo(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return true;
    return await clienteSupabase.eliminarMasivo("documentos_repositorio", ids);
  }
}
