export interface DocumentoRepositorio {
  id: string;
  ano: string;
  lineaInvestigacion: string;
  titulo: string;
  tipoFuente: string;
  pais: string;
  categoria?: string;
  autores: string[];
  enlaceDocumento?: string;
  paginasWeb?: string[];
  resumen?: string;
  referenciaApa?: string;
  paginas?: number;
  likesCount?: number;
  dislikesCount?: number;
  createdAt?: string;
}

export interface FiltrosRepositorio {
  busqueda?: string;
  pais?: string;
  tipoFuente?: string;
  lineaInvestigacion?: string;
  categoria?: string;
  ano?: string;
}
