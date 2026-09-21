import type { CredencialesAcceso, RespuestaAcceso } from "./auth.types";
import { ServicioLimiteIntentosCliente } from "./rate-limit-client.service";

/**
 * Servicio de Autenticación
 * Responsable de la lógica de acceso y validación de usuarios administrativos en Supabase.
 */
export class ServicioAutenticacion {
  private static CLAVE_SESION = "observatorio_usuario_sesion";

  /**
   * Valida las credenciales contra el endpoint /api/auth/login con control de intentos
   */
  static async iniciarSesion(
    credenciales: CredencialesAcceso
  ): Promise<RespuestaAcceso> {
    try {
      // 1. Verificación previa en frontend de rate limit
      const estadoLimite = ServicioLimiteIntentosCliente.verificarEstado();
      if (estadoLimite.bloqueado) {
        return {
          exito: false,
          bloqueado: true,
          segundosRestantes: estadoLimite.segundosRestantes,
          intentosRestantes: 0,
          mensaje: `Has superado el límite de 5 intentos. Por favor, espera ${estadoLimite.segundosRestantes} segundos.`,
        };
      }

      if (!credenciales.email || !credenciales.contrasena) {
        return {
          exito: false,
          mensaje: "Debes ingresar tu correo y tu contraseña.",
        };
      }

      const respuesta = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: credenciales.email.trim(),
          password: credenciales.contrasena,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        // Si el backend dictaminó bloqueo o fallo
        let estadoActualizado = estadoLimite;
        if (datos.bloqueado && datos.segundosRestantes) {
          estadoActualizado = ServicioLimiteIntentosCliente.forzarBloqueo(
            datos.segundosRestantes
          );
        } else {
          estadoActualizado = ServicioLimiteIntentosCliente.registrarFallo();
        }

        return {
          exito: false,
          bloqueado: datos.bloqueado || estadoActualizado.bloqueado,
          segundosRestantes:
            datos.segundosRestantes || estadoActualizado.segundosRestantes,
          intentosRestantes:
            datos.intentosRestantes ?? estadoActualizado.intentosRestantes,
          mensaje: datos.error || "Credenciales incorrectas. Verifica tus datos.",
        };
      }

      // Login exitoso: reiniciar rate limit del cliente
      ServicioLimiteIntentosCliente.reiniciar();

      // Guardar información de sesión en el navegador
      if (typeof window !== "undefined" && datos.usuario) {
        localStorage.setItem(this.CLAVE_SESION, JSON.stringify(datos.usuario));
      }

      return {
        exito: true,
        mensaje: datos.mensaje || "Sesión iniciada correctamente.",
        usuario: datos.usuario,
      };
    } catch (error) {
      console.error("Error al iniciar sesión:", error);
      return {
        exito: false,
        mensaje: "No se pudo conectar con el servidor de autenticación.",
      };
    }
  }

  /**
   * Obtiene el usuario en sesión actual
   */
  static obtenerUsuarioActual() {
    if (typeof window === "undefined") return null;
    try {
      const sesion = localStorage.getItem(this.CLAVE_SESION);
      return sesion ? JSON.parse(sesion) : null;
    } catch {
      return null;
    }
  }

  /**
   * Cierra la sesión activa en el servidor y navegador
   */
  static async cerrarSesion(): Promise<void> {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {}

    if (typeof window !== "undefined") {
      localStorage.removeItem(this.CLAVE_SESION);
    }
  }
}

