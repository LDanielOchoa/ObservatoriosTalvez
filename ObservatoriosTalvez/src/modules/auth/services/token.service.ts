import crypto from "node:crypto";
import { Buffer } from "node:buffer";
import type { UsuarioAutenticado } from "./auth.types";
import type { CargaUtilToken, ResultadoVerificacionToken } from "./token.types";


export const NOMBRE_COOKIE_SESION = "observatorio_token_sesion";

// 20 horas en milisegundos (20 * 60 * 60 * 1000)
export const DURACION_TOKEN_HORAS = 20;
export const DURACION_TOKEN_MS = DURACION_TOKEN_HORAS * 60 * 60 * 1000;
export const DURACION_TOKEN_SEGUNDOS = DURACION_TOKEN_HORAS * 60 * 60;

const CLAVE_SECRETA =
  (typeof process !== "undefined" && process.env?.AUTH_SECRET) ||
  "observatorio_rs_clave_secreta_segura_firmada_2026_jwt_token";

/**
 * Servicio de Tokens de Sesión
 * Responsable de la emisión, firma y verificación de tokens con duración de 20 horas.
 */
export class ServicioToken {
  /**
   * Genera un token firmado con exactamente 20 horas de vigencia
   */
  static generarToken(usuario: UsuarioAutenticado): string {
    const ahora = Date.now();
    const expiraEn = ahora + DURACION_TOKEN_MS;

    const encabezado = {
      alg: "HS256",
      typ: "JWT",
    };

    const cargaUtil: CargaUtilToken = {
      ...usuario,
      iat: ahora,
      exp: expiraEn,
    };

    const encabezadoB64 = Buffer.from(JSON.stringify(encabezado)).toString("base64url");
    const cargaUtilB64 = Buffer.from(JSON.stringify(cargaUtil)).toString("base64url");
    const datosAFirmar = `${encabezadoB64}.${cargaUtilB64}`;

    const firma = crypto
      .createHmac("sha256", CLAVE_SECRETA)
      .update(datosAFirmar)
      .digest("base64url");

    return `${datosAFirmar}.${firma}`;
  }

  /**
   * Verifica la firma y comprueba si el token ha expirado (más de 20 horas)
   */
  static verificarToken(token?: string | null): ResultadoVerificacionToken {
    if (!token || typeof token !== "string" || !token.includes(".")) {
      return { valido: false, razon: "sin_token" };
    }

    const partes = token.split(".");
    if (partes.length !== 3) {
      return { valido: false, razon: "invalido" };
    }

    const [encabezadoB64, cargaUtilB64, firmaOriginal] = partes;
    const datosAFirmar = `${encabezadoB64}.${cargaUtilB64}`;

    const firmaEsperada = crypto
      .createHmac("sha256", CLAVE_SECRETA)
      .update(datosAFirmar)
      .digest("base64url");

    const bufferEsperado = Buffer.from(firmaEsperada);
    const bufferRecibido = Buffer.from(firmaOriginal);

    if (
      bufferEsperado.length !== bufferRecibido.length ||
      !crypto.timingSafeEqual(bufferEsperado, bufferRecibido)
    ) {
      return { valido: false, razon: "invalido" };
    }

    try {
      const cargaUtilJSON = Buffer.from(cargaUtilB64, "base64url").toString("utf-8");
      const cargaUtil: CargaUtilToken = JSON.parse(cargaUtilJSON);

      // Si pasaron las 20 horas desde la emisión, se invalida
      if (Date.now() > cargaUtil.exp) {
        return { valido: false, razon: "expirado" };
      }

      const usuario: UsuarioAutenticado = {
        id: cargaUtil.id,
        nombre: cargaUtil.nombre,
        email: cargaUtil.email,
        rol: cargaUtil.rol,
        tipoUsuario: cargaUtil.tipoUsuario,
        universidad: cargaUtil.universidad,
        carrera: cargaUtil.carrera,
        semestre: cargaUtil.semestre,
        cedula: cargaUtil.cedula,
        estado: cargaUtil.estado,
      };

      return {
        valido: true,
        usuario,
      };
    } catch {
      return { valido: false, razon: "invalido" };
    }
  }
}
