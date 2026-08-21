export interface SolicitudInscripcionRed {
  id: string;
  nombre: string;
  cedula: string;
  telefono: string;
  fechaNacimiento: string;
  universidad: string;
  carrera: string;
  semestre: string;
  fechaSolicitud: string;
  estado: "Pendiente" | "Aprobado" | "Rechazado";
}
