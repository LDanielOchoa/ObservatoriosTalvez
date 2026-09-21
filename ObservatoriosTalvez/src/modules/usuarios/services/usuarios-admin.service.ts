import bcrypt from "bcryptjs";
import { clienteSupabase } from "../../../lib/supabase";
import type {
  UsuarioAdmin,
  CrearUsuarioAdminDTO,
  EditarUsuarioAdminDTO,
} from "./usuarios-admin.types";

/**
 * Servicio para la gestión de usuarios administrativos.
 * En el cliente consume los endpoints /api/usuarios-admin (hashing en servidor).
 * En el servidor (SSR) interactúa directamente con Supabase y bcryptjs.
 */
export class ServicioUsuariosAdmin {
  private static TABLA = "usuarios_administrativos";

  /**
   * Obtiene todos los usuarios administrativos
   */
  static async obtenerUsuarios(): Promise<UsuarioAdmin[]> {
    // Si estamos en el navegador, consultar el endpoint del backend
    if (typeof window !== "undefined") {
      try {
        const respuesta = await fetch("/api/usuarios-admin");
        if (!respuesta.ok) throw new Error("Error al obtener usuarios del servidor");
        return await respuesta.json();
      } catch (error) {
        console.error("Error en petición cliente /api/usuarios-admin:", error);
      }
    }

    // Si estamos en SSR, consultar Supabase directamente
    try {
      const registros = await clienteSupabase.consultar<UsuarioAdmin>(
        this.TABLA,
        "select=*&order=fecha_creacion.desc"
      );
      return registros;
    } catch (error) {
      console.error("Error en SSR al consultar Supabase:", error);
      return [];
    }
  }

  /**
   * Registra un nuevo usuario administrativo con hashing bcrypt garantizado
   */
  static async crearUsuario(datos: CrearUsuarioAdminDTO): Promise<UsuarioAdmin> {
    // En el navegador, enviar la petición al backend de Astro para hashing seguro en Node.js
    if (typeof window !== "undefined") {
      const respuesta = await fetch("/api/usuarios-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!respuesta.ok) {
        const errJson = await respuesta.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudo crear el usuario en el servidor.");
      }

      return await respuesta.json();
    }

    // En el servidor (SSR)
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(datos.password.trim(), salt);

    const payload = {
      nombre: datos.nombre.trim(),
      email: datos.email.trim().toLowerCase(),
      password_hash: passwordHash,
      rol: datos.rol,
      estado: datos.estado || "Activo",
      ultimo_acceso: "Justo ahora",
    };

    return await clienteSupabase.insertar<UsuarioAdmin>(this.TABLA, payload);
  }

  /**
   * Actualiza un usuario administrativo
   */
  static async actualizarUsuario(
    id: string,
    datos: EditarUsuarioAdminDTO
  ): Promise<UsuarioAdmin> {
    // En el navegador
    if (typeof window !== "undefined") {
      const respuesta = await fetch(`/api/usuarios-admin/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });

      if (!respuesta.ok) {
        const errJson = await respuesta.json().catch(() => ({}));
        throw new Error(errJson.error || "No se pudo actualizar el usuario en el servidor.");
      }

      return await respuesta.json();
    }

    // En el servidor (SSR)
    const payload: Record<string, any> = {};
    if (datos.nombre !== undefined) payload.nombre = datos.nombre.trim();
    if (datos.email !== undefined) payload.email = datos.email.trim().toLowerCase();
    if (datos.rol !== undefined) payload.rol = datos.rol;
    if (datos.estado !== undefined) payload.estado = datos.estado;

    if (datos.password && datos.password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      payload.password_hash = bcrypt.hashSync(datos.password.trim(), salt);
    }

    return await clienteSupabase.actualizar<UsuarioAdmin>(this.TABLA, id, payload);
  }

  /**
   * Elimina un usuario administrativo por ID
   */
  static async eliminarUsuario(id: string): Promise<boolean> {
    if (typeof window !== "undefined") {
      const respuesta = await fetch(`/api/usuarios-admin/${id}`, {
        method: "DELETE",
      });
      if (!respuesta.ok) throw new Error("Error al eliminar usuario del servidor.");
      return true;
    }

    return await clienteSupabase.eliminar(this.TABLA, id);
  }

  /**
   * Elimina un conjunto de usuarios administrativos por IDs
   */
  static async eliminarUsuariosMasivo(ids: string[]): Promise<boolean> {
    if (typeof window !== "undefined") {
      const respuesta = await fetch("/api/usuarios-admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!respuesta.ok) throw new Error("Error en eliminación masiva en el servidor.");
      return true;
    }

    return await clienteSupabase.eliminarMasivo(this.TABLA, ids);
  }
}
