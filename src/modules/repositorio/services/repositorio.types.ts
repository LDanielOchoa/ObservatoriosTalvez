export interface DocumentoRepositorio {
  id: string;
  ano: string;
  lineaInvestigacion: string;
  titulo: string;
  tipoFuente: string;
  pais: string;
  autores: string[];
  enlaceDocumento?: string;
  resumen?: string;
  referenciaApa?: string;
  paginas?: number;
}

export interface FiltrosRepositorio {
  busqueda?: string;
  pais?: string;
  tipoFuente?: string;
  ano?: string;
}
