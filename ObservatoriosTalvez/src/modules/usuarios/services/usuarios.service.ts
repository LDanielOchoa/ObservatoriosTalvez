import type { UsuarioRed } from "./usuarios.types";
import { clienteSupabase } from "../../../lib/supabase";

const TABLA = "usuarios_estudiantes";

/**
 * Servicio encargado de gestionar los usuarios estudiantes registrados en la Red de Aprendizaje
 */
export class ServicioUsuarios {
  /**
   * Obtiene todos los estudiantes registrados desde Supabase
   */
  static async obtenerUsuarios(): Promise<UsuarioRed[]> {
    try {
      const registros = await clienteSupabase.consultar<any>(
        TABLA,
        "select=*&order=created_at.desc"
      );

      if (registros && registros.length > 0) {
        return registros.map((item) => ({
          id: item.id,
          nombre: item.nombre || "Sin nombre",
          email: item.email || "",
          cedula: item.cedula || "",
          telefono: item.telefono || "",
          fechaNacimiento: item.fecha_nacimiento || "",
          universidad: item.universidad || "Sin universidad",
          carrera: item.carrera || "Sin carrera",
          semestre: item.semestre ? `${item.semestre}° Semestre` : "No especificado",
          fechaRegistro: item.created_at ? item.created_at.split("T")[0] : "Reciente",
          estado: (item.estado as any) || "Activo",
        }));
      }

      return [];
    } catch (error) {
      console.error("Error al obtener usuarios estudiantes:", error);
      return [];
    }
  }

  /**
   * Obtiene un estudiante por su ID
   */
  static async obtenerUsuarioPorId(id: string): Promise<UsuarioRed | undefined> {
    try {
      const registros = await clienteSupabase.consultar<any>(
        TABLA,
        `id=eq.${id}&select=*`
      );

      if (registros && registros.length > 0) {
        const item = registros[0];
        return {
          id: item.id,
          nombre: item.nombre || "Sin nombre",
          email: item.email || "",
          cedula: item.cedula || "",
          telefono: item.telefono || "",
          fechaNacimiento: item.fecha_nacimiento || "",
          universidad: item.universidad || "Sin universidad",
          carrera: item.carrera || "Sin carrera",
          semestre: item.semestre || "",
          fechaRegistro: item.created_at ? item.created_at.split("T")[0] : "Reciente",
          estado: (item.estado as any) || "Activo",
        };
      }

      return undefined;
    } catch (error) {
      console.error(`Error al obtener usuario ${id}:`, error);
      return undefined;
    }
  }

  /**
   * Elimina un usuario estudiante
   */
  static async eliminarUsuario(id: string): Promise<{ exito: boolean; mensaje?: string }> {
    try {
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      return { exito: res.ok, mensaje: data.error || data.mensaje };
    } catch (error: any) {
      return { exito: false, mensaje: error.message };
    }
  }

  /**
   * Elimina múltiples usuarios estudiantes
   */
  static async eliminarUsuariosMasivo(ids: string[]): Promise<{ exito: boolean; mensaje?: string }> {
    try {
      const res = await fetch("/api/usuarios", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      return { exito: res.ok, mensaje: data.error || data.mensaje };
    } catch (error: any) {
      return { exito: false, mensaje: error.message };
    }
  }
}
