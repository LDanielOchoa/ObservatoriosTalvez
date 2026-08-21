export interface CredencialesAcceso {
  email: string;
  contrasena: string;
}

export interface RespuestaAcceso {
  exito: boolean;
  mensaje?: string;
  token?: string;
}
