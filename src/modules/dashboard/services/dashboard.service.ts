import type { DatosDashboardHome, ItemNewsFeed, ItemYoutubeFeed } from "./dashboard.types";
import { ServicioMetadatos } from "./metadatos.service";

/**
 * Listado de enlaces configurados para News Feed.
 * Los datos se obtienen dinámicamente mediante scraping/metadatos.
 */
export const ENLACES_NEWS_FEED: string[] = [
  "https://www.eltiempo.com/colombia/otras-ciudades/terremoto-en-colombia-hoy-viernes-21-de-agosto-ultimas-noticias-balance-de-la-emergencia-y-nuevos-temblores-en-el-pais-3579889",
  "https://www.eltiempo.com/colombia/otras-ciudades/el-angustiante-llamado-de-un-campesino-en-tolima-tras-voraz-incendio-la-vaina-esta-complicada-3579928",
  "https://es.euronews.com/video/2026/08/21/mexico-las-batallas-de-aura-convierten-un-meme-viral-en-concursos-en-directo",
];

/**
 * Listado de enlaces configurados para YouTube Feed.
 * Los datos (título, canal/autor, miniatura oficial HD) se obtienen
 * 100% dinámicamente usando la API oEmbed oficial de YouTube.
 */
export const ENLACES_YOUTUBE_FEED: string[] = [
  "https://www.youtube.com/watch?v=EG7myhET2TA",
];

/**
 * Servicio del Dashboard
 * Conecta los enlaces y extrae automáticamente los metadatos en tiempo real.
 */
export class ServicioDashboard {
  static async obtenerDatosHome(): Promise<DatosDashboardHome> {
    // 1. Extracción dinámica para noticias
    const noticias: ItemNewsFeed[] = await Promise.all(
      ENLACES_NEWS_FEED.map(async (enlace, index) => {
        const meta = await ServicioMetadatos.extraerMetadatos(enlace);

        const palabras = `${meta.titulo} ${meta.descripcion}`.split(/\s+/).length;
        const minutosLectura = Math.max(3, Math.ceil(palabras / 30));

        return {
          id: `news-${index + 1}`,
          fecha: meta.fechaPublicacion || "21 de Agosto, 2026",
          categoria: "Actualidad",
          titulo: meta.titulo,
          descripcion: meta.descripcion,
          enlace: enlace,
          imagen: meta.imagen,
          fuente: meta.sitio,
          lecturaMinutos: minutosLectura,
        };
      })
    );

    // 2. Extracción dinámica para videos de YouTube
    const videos: ItemYoutubeFeed[] = await Promise.all(
      ENLACES_YOUTUBE_FEED.map(async (enlace, index) => {
        const meta = await ServicioMetadatos.extraerMetadatosYoutube(enlace);

        return {
          id: `video-${index + 1}`,
          titulo: meta.titulo,
          duracion: "Video",
          canal: meta.canal,
          enlace: meta.enlace,
          imagenMiniatura: meta.imagenMiniatura,
          etiqueta: "YouTube",
          descripcion: `Publicado por ${meta.canal}. Reproduce el video para ver el contenido completo.`,
        };
      })
    );

    return {
      usuarioNombre: "Usuario",
      noticias,
      videos,
    };
  }
}
