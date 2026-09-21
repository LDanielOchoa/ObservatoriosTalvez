export type RolAdmin = "Super Administrador" | "Administrador" | "Editor";

export type EstadoAdmin = "Activo" | "Inactivo";

export interface UsuarioAdmin {
  id: string;
  nombre: string;
  email: string;
  rol: RolAdmin;
  estado: EstadoAdmin;
  fecha_creacion: string;
  ultimo_acceso?: string;
  password_hash?: string;
}

export interface CrearUsuarioAdminDTO {
  nombre: string;
  email: string;
  password: string;
  rol: RolAdmin;
  estado?: EstadoAdmin;
}

export interface EditarUsuarioAdminDTO {
  nombre?: string;
  email?: string;
  password?: string;
  rol?: RolAdmin;
  estado?: EstadoAdmin;
}

export interface FiltrosUsuariosAdmin {
  busqueda?: string;
  rol?: string;
  estado?: string;
}
