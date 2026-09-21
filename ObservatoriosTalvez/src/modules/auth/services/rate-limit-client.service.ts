import type { EstadoLimiteTasa } from "./rate-limit.types";

interface DatosAlmacenados {
  intentos: number;
  bloqueadoHasta: number | null;
}

/**
 * Servicio de límite de intentos (Rate Limiting) para el cliente / navegador
 * Persiste los intentos y el tiempo de bloqueo en localStorage.
 */
export class ServicioLimiteIntentosCliente {
  private static CLAVE_STORAGE = "observatorio_rate_limit_cliente";
  private static MAX_INTENTOS = 5;
  private static TIEMPO_BLOQUEO_MS = 60 * 1000; // 1 minuto

  private static obtenerDatos(): DatosAlmacenados {
    if (typeof window === "undefined") {
      return { intentos: 0, bloqueadoHasta: null };
    }
    try {
      const serializado = localStorage.getItem(this.CLAVE_STORAGE);
      if (!serializado) return { intentos: 0, bloqueadoHasta: null };
      return JSON.parse(serializado);
    } catch {
      return { intentos: 0, bloqueadoHasta: null };
    }
  }

  private static guardarDatos(datos: DatosAlmacenados): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(this.CLAVE_STORAGE, JSON.stringify(datos));
    } catch {
      // Ignorar errores de almacenamiento local
    }
  }

  /**
   * Consulta el estado de bloqueo actual en el cliente
   */
  static verificarEstado(): EstadoLimiteTasa {
    const datos = this.obtenerDatos();
    const ahora = Date.now();

    if (datos.bloqueadoHasta && ahora < datos.bloqueadoHasta) {
      const segundosRestantes = Math.ceil((datos.bloqueadoHasta - ahora) / 1000);
      return {
        bloqueado: true,
        segundosRestantes,
        intentosRealizados: datos.intentos,
        intentosRestantes: 0,
      };
    }

    // Si expiró el bloqueo, restablecer
    if (datos.bloqueadoHasta && ahora >= datos.bloqueadoHasta) {
      this.reiniciar();
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
      intentosRealizados: datos.intentos,
      intentosRestantes: Math.max(0, this.MAX_INTENTOS - datos.intentos),
    };
  }

  /**
   * Registra un fallo en el cliente y activa el bloqueo de 60s si llega a 5 intentos
   */
  static registrarFallo(): EstadoLimiteTasa {
    const datos = this.obtenerDatos();
    const ahora = Date.now();

    if (datos.bloqueadoHasta && ahora >= datos.bloqueadoHasta) {
      datos.intentos = 0;
      datos.bloqueadoHasta = null;
    }

    datos.intentos += 1;

    if (datos.intentos >= this.MAX_INTENTOS) {
      datos.bloqueadoHasta = ahora + this.TIEMPO_BLOQUEO_MS;
      this.guardarDatos(datos);

      return {
        bloqueado: true,
        segundosRestantes: Math.ceil(this.TIEMPO_BLOQUEO_MS / 1000),
        intentosRealizados: datos.intentos,
        intentosRestantes: 0,
      };
    }

    this.guardarDatos(datos);

    return {
      bloqueado: false,
      segundosRestantes: 0,
      intentosRealizados: datos.intentos,
      intentosRestantes: Math.max(0, this.MAX_INTENTOS - datos.intentos),
    };
  }

  /**
   * Sincroniza un bloqueo dictado por el backend
   */
  static forzarBloqueo(segundos: number): EstadoLimiteTasa {
    const ahora = Date.now();
    const datos: DatosAlmacenados = {
      intentos: this.MAX_INTENTOS,
      bloqueadoHasta: ahora + segundos * 1000,
    };
    this.guardarDatos(datos);

    return {
      bloqueado: true,
      segundosRestantes: segundos,
      intentosRealizados: this.MAX_INTENTOS,
      intentosRestantes: 0,
    };
  }

  /**
   * Limpia el registro de intentos fallidos
   */
  static reiniciar(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.CLAVE_STORAGE);
    }
  }
}
