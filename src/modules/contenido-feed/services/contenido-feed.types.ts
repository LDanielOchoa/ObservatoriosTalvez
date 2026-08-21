export type TipoFeed = "noticia" | "youtube";

export interface ItemFeedAdmin {
  id: string;
  tipo: TipoFeed;
  enlace: string;
  titulo: string;
  descripcion: string;
  imagen?: string;
  fuenteOCanal?: string;
  fechaPublicacion?: string;
  categoria?: string;
  duracionOLectura?: string;
  estado: "Publicado" | "Borrador";
}

export interface ResultadoAnalisisUrl {
  tipo: TipoFeed;
  enlace: string;
  titulo: string;
  descripcion: string;
  imagen?: string;
  fuenteOCanal?: string;
  fechaPublicacion?: string;
  categoria?: string;
  duracionOLectura?: string;
}
