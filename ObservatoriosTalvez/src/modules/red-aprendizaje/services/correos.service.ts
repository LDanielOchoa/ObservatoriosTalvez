import type { CorreoEnviado, PlantillaRed } from "./correos.types";
import { clienteSupabase } from "../../../lib/supabase";

export class ServicioCorreosRed {
  private static plantillaUnica: PlantillaRed = {
    id: "plantilla-oficial-red",
    nombre: "Notificación de Admisión Institucional",
    asunto: "Notificación de Admisión - Red de Aprendizaje",
    encabezadoTitulo: "Notificación de Admisión",
    encabezadoSubtitulo: "Observatorio de Responsabilidad Social y Sostenibilidad",
    contenidoMarkdown: `Estimado(a) **{{nombre}}**,

Nos complace informarte que tu postulación para integrarte a la **Red de Aprendizaje** del Observatorio ha sido evaluada y **aprobada formalmente**.

Tus credenciales de acceso institucional:
- **Usuario / Correo:** {{email}}
- **Contraseña inicial:** Tu número de identificación (cédula)

A través de la plataforma podrás acceder a los módulos de investigación, proyectos colaborativos y convocatorias activas de la red.`,
    textoBotonCta: "Ingresar a la Plataforma",
    enlaceBotonCta: "https://observatorio.org/login",
    mensajePie: "Observatorio de Responsabilidad Social y Sostenibilidad · 2026",
    variables: ["{{nombre}}", "{{carrera}}", "{{universidad}}", "{{email}}", "{{cedula}}"],
  };

  /**
   * Obtiene los correos enviados consultando la tabla registro_correos_red en Supabase
   */
  static async obtenerCorreosEnviados(): Promise<CorreoEnviado[]> {
    try {
      const registros = await clienteSupabase.consultar<any>(
        "registro_correos_red",
        "order=fecha_envio.desc&select=*"
      );

      if (registros && registros.length > 0) {
        return registros.map((r) => {
          const fecha = r.fecha_envio ? new Date(r.fecha_envio) : new Date();
          return {
            id: r.id,
            destinatarioNombre: r.nombre_destinatario || "Aspirante",
            destinatarioEmail: r.email_destinatario || "",
            asunto: r.asunto || "Notificación de Admisión",
            plantilla: r.tipo || "Notificación de Admisión",
            contenidoHtml: r.contenido_html || "",
            fechaEnvio: fecha.toLocaleDateString("es-CO", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            horaEnvio: fecha.toLocaleTimeString("es-CO", {
              hour: "2-digit",
              minute: "2-digit",
            }),
            estado: (r.estado_envio as any) || "Enviado",
          };
        });
      }

      return [];
    } catch (error) {
      console.error("Error al obtener historial de correos enviados:", error);
      return [];
    }
  }

  static async obtenerPlantilla(): Promise<PlantillaRed> {
    return this.plantillaUnica;
  }

  static async guardarPlantilla(plantilla: PlantillaRed): Promise<void> {
    this.plantillaUnica = { ...plantilla };
  }

  static async enviarCorreoPrueba(
    emailDestino: string,
    asuntoPersonalizado?: string
  ): Promise<{ exito: boolean; mensaje: string }> {
    try {
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "https://gazmrklvrqajobxkblqz.supabase.co";
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";

      const res = await fetch(`${supabaseUrl}/functions/v1/enviar-correo-bienvenida`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          nombre: "Usuario de Prueba",
          email: emailDestino,
          cedula: "1000000000",
          universidad: "Universidad de Prueba",
          carrera: "Ingeniería de Software",
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo despachar el correo de prueba");
      }

      return {
        exito: true,
        mensaje: `Correo de prueba enviado satisfactoriamente a ${emailDestino}`,
      };
    } catch {
      return {
        exito: false,
        mensaje: `No se pudo enviar el correo de prueba a ${emailDestino}.`,
      };
    }
  }
}

