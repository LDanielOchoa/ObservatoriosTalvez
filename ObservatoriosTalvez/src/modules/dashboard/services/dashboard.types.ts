export interface MetadatosUrl {
  titulo: string;
  descripcion: string;
  imagen?: string;
  sitio?: string;
  autor?: string;
  fechaPublicacion?: string;
}

export interface ItemNewsFeed {
  id: string;
  fecha: string;
  categoria: string;
  titulo: string;
  descripcion: string;
  enlace: string;
  imagen?: string;
  fuente?: string;
  lecturaMinutos?: number;
  destacado?: boolean;
  likesCount?: number;
  dislikesCount?: number;
}

export interface ItemYoutubeFeed {
  id: string;
  titulo: string;
  duracion: string;
  canal: string;
  enlace: string;
  imagenMiniatura?: string;
  etiqueta?: string;
  descripcion?: string;
  destacado?: boolean;
  likesCount?: number;
  dislikesCount?: number;
}

export interface DatosDashboardHome {
  usuarioNombre: string;
  noticias: ItemNewsFeed[];
  videos: ItemYoutubeFeed[];
}
