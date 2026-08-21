export interface DatosRegistroRed {
  nombre: string;
  cedula: string;
  telefono: string;
  dia: number;
  mes: string;
  anio: number;
  universidad: string;
  semestre: string;
  carrera: string;
}

export interface RespuestaRegistroRed {
  exito: boolean;
  mensaje?: string;
}
