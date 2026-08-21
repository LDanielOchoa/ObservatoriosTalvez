import type { CorreoEnviado, PlantillaRed } from "./correos.types";

export class ServicioCorreosRed {
  private static plantillaUnica: PlantillaRed = {
    id: "plantilla-oficial-red",
    nombre: "Plantilla Oficial de la Red de Aprendizaje",
    asunto: "¡Felicitaciones! Has sido aceptado en la Red de Aprendizaje",
    encabezadoTitulo: "¡Bienvenido/a a la Red!",
    encabezadoSubtitulo: "Tu solicitud ha sido aprobada con éxito",
    contenidoMarkdown: `Hola **{{nombre}}**,

Nos complace informarte que tu postulación como estudiante del programa **{{carrera}}** de la **{{universidad}}** ha sido revisada y aprobada formalmente por el comité del Observatorio.

### Beneficios de tu membresía:
- Acceso a repositorios exclusivos de investigación y datos.
- Participación en talleres sincrónicos y mesas de trabajo.
- Certificado institucional de participación activa.

Haz clic en el siguiente botón para activar tu acceso al portal institucional:`,
    textoBotonCta: "Activar mi cuenta y entrar",
    enlaceBotonCta: "https://observatorio.org/red/activar?token={{token}}",
    mensajePie: "Observatorio de Responsabilidad Social y Sostenibilidad · 2026",
    variables: ["{{nombre}}", "{{carrera}}", "{{universidad}}", "{{fecha}}", "{{token}}"],
  };

  private static correosEnviados: CorreoEnviado[] = [
    {
      id: "email-1",
      destinatarioNombre: "Mariana Lucía Henao",
      destinatarioEmail: "mariana.henao@eafit.edu.co",
      asunto: "¡Felicitaciones! Has sido aceptado en la Red de Aprendizaje",
      plantilla: "Plantilla Oficial de la Red",
      fechaEnvio: "21 de Agosto, 2026",
      horaEnvio: "14:32",
      estado: "Abierto",
    },
    {
      id: "email-2",
      destinatarioNombre: "Mateo Sebastián Bermúdez",
      destinatarioEmail: "mateo.bermudez@javeriana.edu.co",
      asunto: "¡Felicitaciones! Has sido aceptado en la Red de Aprendizaje",
      plantilla: "Plantilla Oficial de la Red",
      fechaEnvio: "21 de Agosto, 2026",
      horaEnvio: "11:15",
      estado: "Entregado",
    },
    {
      id: "email-3",
      destinatarioNombre: "Valentina Gómez Duque",
      destinatarioEmail: "valentina.gomez@udea.edu.co",
      asunto: "¡Felicitaciones! Has sido aceptado en la Red de Aprendizaje",
      plantilla: "Plantilla Oficial de la Red",
      fechaEnvio: "21 de Agosto, 2026",
      horaEnvio: "09:40",
      estado: "Entregado",
    },
    {
      id: "email-4",
      destinatarioNombre: "Felipe Andrés Cardona",
      destinatarioEmail: "felipe.cardona@upb.edu.co",
      asunto: "¡Felicitaciones! Has sido aceptado en la Red de Aprendizaje",
      plantilla: "Plantilla Oficial de la Red",
      fechaEnvio: "20 de Agosto, 2026",
      horaEnvio: "16:20",
      estado: "Abierto",
    },
    {
      id: "email-5",
      destinatarioNombre: "Nicolás David Pardo",
      destinatarioEmail: "nicolas.pardo@uniandes.edu.co",
      asunto: "¡Felicitaciones! Has sido aceptado en la Red de Aprendizaje",
      plantilla: "Plantilla Oficial de la Red",
      fechaEnvio: "19 de Agosto, 2026",
      horaEnvio: "10:05",
      estado: "Entregado",
    },
  ];

  static async obtenerCorreosEnviados(): Promise<CorreoEnviado[]> {
    return this.correosEnviados;
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
    const nuevoEnvio: CorreoEnviado = {
      id: `email-${Date.now()}`,
      destinatarioNombre: "Usuario de Prueba",
      destinatarioEmail: emailDestino,
      asunto: asuntoPersonalizado || `[PRUEBA] ${this.plantillaUnica.asunto}`,
      plantilla: this.plantillaUnica.nombre,
      fechaEnvio: "Hoy",
      horaEnvio: new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
      estado: "Enviado",
      esPrueba: true,
    };

    this.correosEnviados.unshift(nuevoEnvio);

    return {
      exito: true,
      mensaje: `Correo de prueba enviado satisfactoriamente a ${emailDestino}`,
    };
  }
}
