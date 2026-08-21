import type { DatosRegistroRed, RespuestaRegistroRed } from "./red.types";

/**
 * Servicio de Red de Aprendizaje
 * Responsable de gestionar el registro e información de participantes de la red.
 */
export class ServicioRedAprendizaje {
  static async registrarParticipante(datos: DatosRegistroRed): Promise<RespuestaRegistroRed> {
    try {
      // Validaciones básicas de negocio
      if (!datos.nombre || !datos.cedula || !datos.universidad) {
        return {
          exito: false,
          mensaje: "Por favor complete todos los campos obligatorios.",
        };
      }

      return {
        exito: true,
        mensaje: "Registro completado con éxito.",
      };
    } catch (error) {
      return {
        exito: false,
        mensaje: "Error al procesar la inscripción.",
      };
    }
  }
}
