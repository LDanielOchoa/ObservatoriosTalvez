export type EstadoEnvioCorreo = "Entregado" | "Abierto" | "Enviado" | "En cola" | "Fallido";

export interface CorreoEnviado {
  id: string;
  destinatarioNombre: string;
  destinatarioEmail: string;
  asunto: string;
  plantilla: string;
  fechaEnvio: string;
  horaEnvio: string;
  estado: EstadoEnvioCorreo;
  contenidoHtml?: string;
  esPrueba?: boolean;
}

export interface PlantillaRed {
  id: string;
  nombre: string;
  asunto: string;
  encabezadoTitulo: string;
  encabezadoSubtitulo: string;
  contenidoMarkdown: string;
  textoBotonCta: string;
  enlaceBotonCta: string;
  mensajePie: string;
  variables: string[];
}
