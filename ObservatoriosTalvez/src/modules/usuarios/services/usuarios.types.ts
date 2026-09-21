export interface UsuarioRed {
  id: string;
  nombre: string;
  email: string;
  cedula: string;
  telefono: string;
  fechaNacimiento: string;
  universidad: string;
  carrera: string;
  semestre: string;
  fechaRegistro: string;
  estado: "Activo" | "Pendiente" | "Inactivo";
}

export interface FiltrosUsuarios {
  busqueda?: string;
  carrera?: string;
  universidad?: string;
}
