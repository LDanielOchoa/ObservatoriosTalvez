export interface DatosRegistroRed {
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  dia: number;
  mes: string;
  anio: number;
  universidad: string;
  semestre: string;
  carrera: string;
}

export interface RegistroRedNuevo {
  id: string;
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  fecha_nacimiento: string;
  universidad: string;
  carrera: string;
  semestre: string;
  estado: "Pendiente" | "Aprobado" | "Rechazado";
  created_at: string;
}

export interface RespuestaRegistroRed {
  exito: boolean;
  mensaje?: string;
  registro?: RegistroRedNuevo;
}
