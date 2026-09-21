import type { EstadoLimiteTasa } from "./rate-limit.types";

interface RegistroIntento {
  intentos: number;
  bloqueadoHasta: number | null;
  marcaTiempo: number;
}

/**
 * Servicio de límite de intentos (Rate Limiting) para el backend
 * Controla un máximo de 5 intentos fallidos con bloqueo de 1 minuto (60 segundos).
 */
export class ServicioLimiteIntentosServidor {
  private static MAX_INTENTOS = 5;
  private static TIEMPO_BLOQUEO_MS = 60 * 1000; // 1 minuto
  private static registros = new Map<string, RegistroIntento>();

  /**
   * Limpia registros antiguos para evitar fugas de memoria
   */
  private static limpiarExpirados(): void {
    const ahora = Date.now();
    for (const [clave, registro] of this.registros.entries()) {
      if (
        registro.bloqueadoHasta &&
        ahora > registro.bloqueadoHasta &&
        ahora - registro.marcaTiempo > this.TIEMPO_BLOQUEO_MS
      ) {
        this.registros.delete(clave);
      }
    }
  }

  /**
   * Verifica si el identificador se encuentra actualmente bloqueado
   */
  static verificarEstado(identificador: string): EstadoLimiteTasa {
    this.limpiarExpirados();
    const registro = this.registros.get(identificador);
    const ahora = Date.now();

    if (!registro) {
      return {
        bloqueado: false,
        segundosRestantes: 0,
        intentosRealizados: 0,
        intentosRestantes: this.MAX_INTENTOS,
      };
    }

    if (registro.bloqueadoHasta && ahora < registro.bloqueadoHasta) {
      const msRestantes = registro.bloqueadoHasta - ahora;
      const segundosRestantes = Math.ceil(msRestantes / 1000);
      return {
        bloqueado: true,
        segundosRestantes,
        intentosRealizados: registro.intentos,
        intentosRestantes: 0,
      };
    }

    // Si ya pasó el tiempo de bloqueo, se reinician los intentos
    if (registro.bloqueadoHasta && ahora >= registro.bloqueadoHasta) {
      this.registros.delete(identificador);
      return {
        bloqueado: false,
        segundosRestantes: 0,
        intentosRealizados: 0,
        intentosRestantes: this.MAX_INTENTOS,
      };
    }

    return {
      bloqueado: false,
      segundosRestantes: 0,
      intentosRealizados: registro.intentos,
      intentosRestantes: Math.max(0, this.MAX_INTENTOS - registro.intentos),
    };
  }

  /**
   * Registra un intento fallido y bloquea si llega al límite de 5 intentos
   */
  static registrarFallo(identificador: string): EstadoLimiteTasa {
    this.limpiarExpirados();
    const ahora = Date.now();
    let registro = this.registros.get(identificador);

    if (!registro || (registro.bloqueadoHasta && ahora >= registro.bloqueadoHasta)) {
      registro = {
        intentos: 1,
        bloqueadoHasta: null,
        marcaTiempo: ahora,
      };
    } else {
      registro.intentos += 1;
      registro.marcaTiempo = ahora;
    }

    if (registro.intentos >= this.MAX_INTENTOS) {
      registro.bloqueadoHasta = ahora + this.TIEMPO_BLOQUEO_MS;
      this.registros.set(identificador, registro);

      return {
        bloqueado: true,
        segundosRestantes: Math.ceil(this.TIEMPO_BLOQUEO_MS / 1000),
        intentosRealizados: registro.intentos,
        intentosRestantes: 0,
      };
    }

    this.registros.set(identificador, registro);

    return {
      bloqueado: false,
      segundosRestantes: 0,
      intentosRealizados: registro.intentos,
      intentosRestantes: Math.max(0, this.MAX_INTENTOS - registro.intentos),
    };
  }

  /**
   * Limpia los intentos cuando el inicio de sesión es exitoso
   */
  static limpiar(identificador: string): void {
    this.registros.delete(identificador);
  }
}
