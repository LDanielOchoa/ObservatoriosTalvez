import type { CredencialesAcceso, RespuestaAcceso } from "./auth.types";

/**
 * Servicio de Autenticación
 * Responsable de la lógica de acceso y validación de usuarios.
 */
export class ServicioAutenticacion {
  static async iniciarSesion(credenciales: CredencialesAcceso): Promise<RespuestaAcceso> {
    try {
      // Simulación o llamada a endpoint real
      if (!credenciales.email || !credenciales.contrasena) {
        return {
          exito: false,
          mensaje: "Debe ingresar el correo y la contraseña.",
        };
      }
      
      return {
        exito: true,
        mensaje: "Bienvenido al Observatorio.",
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: "Ocurrió un error inesperado al iniciar sesión.",
      };
    }
  }
}
