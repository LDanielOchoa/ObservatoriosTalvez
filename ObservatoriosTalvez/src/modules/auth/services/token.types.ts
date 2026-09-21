import type { UsuarioAutenticado } from "./auth.types";

/**
 * Estructura de la carga útil (payload) contenida en el token de sesión
 */
export interface CargaUtilToken extends UsuarioAutenticado {
  iat: number; // Marca de tiempo de emisión (ms)
  exp: number; // Marca de tiempo de expiración (ms - 20 horas)
}

/**
 * Resultado de la verificación criptográfica del token
 */
export interface ResultadoVerificacionToken {
  valido: boolean;
  razon?: "expirado" | "invalido" | "sin_token";
  usuario?: UsuarioAutenticado;
}
