export interface CredencialesAcceso {
  email: string;
  contrasena: string;
}

export interface UsuarioAutenticado {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  tipoUsuario?: "administrativo" | "estudiante";
  universidad?: string;
  carrera?: string;
  semestre?: string;
  cedula?: string;
  estado?: string;
}

export interface RespuestaAcceso {
  exito: boolean;
  mensaje?: string;
  usuario?: UsuarioAutenticado;
  token?: string;
  bloqueado?: boolean;
  segundosRestantes?: number;
  intentosRestantes?: number;
}

