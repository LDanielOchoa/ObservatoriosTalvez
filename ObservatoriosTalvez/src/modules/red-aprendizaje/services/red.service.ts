import type { DatosRegistroRed, RespuestaRegistroRed } from "./red.types";

/**
 * Servicio de Red de Aprendizaje
 * Responsable de gestionar el registro e información de participantes de la red.
 */
export class ServicioRedAprendizaje {
  /**
   * Envía los datos de postulación al endpoint de registro
   */
  static async registrarParticipante(
    datos: DatosRegistroRed
  ): Promise<RespuestaRegistroRed> {
    try {
      if (
        !datos.nombre ||
        !datos.email ||
        !datos.cedula ||
        !datos.telefono ||
        !datos.universidad ||
        !datos.carrera ||
        !datos.semestre ||
        !datos.dia ||
        !datos.mes ||
        !datos.anio
      ) {
        return {
          exito: false,
          mensaje: "Por favor completa todos los campos obligatorios.",
        };
      }

      const respuesta = await fetch("/api/red-aprendizaje/registro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datos),
      });

      const resultado = await respuesta.json();

      if (!respuesta.ok) {
        return {
          exito: false,
          mensaje:
            resultado.error || "No se pudo completar el registro a la red.",
        };
      }

      return {
        exito: true,
        mensaje:
          resultado.mensaje || "Tu solicitud ha sido enviada con éxito.",
        registro: resultado.registro,
      };
    } catch (error) {
      console.error("Error en ServicioRedAprendizaje:", error);
      return {
        exito: false,
        mensaje: "Error de conexión al enviar el registro.",
      };
    }
  }
}
