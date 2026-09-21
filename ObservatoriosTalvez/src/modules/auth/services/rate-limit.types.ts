export interface EstadoLimiteTasa {
  bloqueado: boolean;
  segundosRestantes: number;
  intentosRealizados: number;
  intentosRestantes: number;
}
