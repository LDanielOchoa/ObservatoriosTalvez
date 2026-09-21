export interface SolicitudInscripcionRed {
  id: string;
  nombre: string;
  email?: string;
  cedula: string;
  telefono: string;
  fechaNacimiento: string;
  universidad: string;
  carrera: string;
  semestre: string;
  fechaSolicitud: string;
  estado: "Pendiente" | "Aprobado" | "Rechazado";
}

export interface ConfiguracionConvocatoria {
  activo: boolean;
  fechaLimite: string | null;
  mensajeCierre: string;
  updatedAt?: string;
}

