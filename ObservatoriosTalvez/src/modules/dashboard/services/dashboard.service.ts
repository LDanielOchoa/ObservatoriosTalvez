import type { DatosDashboardHome, ItemNewsFeed, ItemYoutubeFeed } from "./dashboard.types";
import { ServicioContenidoFeed } from "../../contenido-feed/services/contenido-feed.service";

/**
 * Servicio del Dashboard
 * Conecta directamente con la base de datos de Supabase para obtener las noticias y videos reales publicados.
 */
export class ServicioDashboard {
  static async obtenerDatosHome(): Promise<DatosDashboardHome> {
    try {
      const itemsFeed = await ServicioContenidoFeed.obtenerItems();

      // 1. Filtrar y mapear noticias publicadas (Destacados SIEMPRE de primero)
      const noticiasPublicadas = itemsFeed
        .filter((item) => item.tipo === "noticia" && item.estado === "Publicado")
        .sort((a, b) => {
          if (Boolean(a.destacado) && !Boolean(b.destacado)) return -1;
          if (!Boolean(a.destacado) && Boolean(b.destacado)) return 1;
          return 0;
        });

      const noticias: ItemNewsFeed[] = noticiasPublicadas.map((item) => {
        // Extraer minutos de lectura si viene como texto
        let minutosLectura = 4;
        if (item.duracionOLectura) {
          const match = item.duracionOLectura.match(/(\d+)/);
          if (match) {
            minutosLectura = parseInt(match[1], 10);
          }
        }

        return {
          id: item.id,
          fecha: item.fechaPublicacion || "Actual",
          categoria: item.categoria || "Actualidad",
          titulo: item.titulo,
          descripcion: item.descripcion || "",
          enlace: item.enlace,
          imagen: item.imagen,
          fuente: item.fuenteOCanal || "Web",
          lecturaMinutos: minutosLectura,
          destacado: Boolean(item.destacado),
          likesCount: item.likesCount || 0,
          dislikesCount: item.dislikesCount || 0,
        };
      });

      // 2. Filtrar y mapear videos de YouTube publicados (Destacados SIEMPRE de primero)
      const videosPublicados = itemsFeed
        .filter((item) => item.tipo === "youtube" && item.estado === "Publicado")
        .sort((a, b) => {
          if (Boolean(a.destacado) && !Boolean(b.destacado)) return -1;
          if (!Boolean(a.destacado) && Boolean(b.destacado)) return 1;
          return 0;
        });

      const videos: ItemYoutubeFeed[] = videosPublicados.map((item) => ({
        id: item.id,
        titulo: item.titulo,
        duracion: item.duracionOLectura || "Video",
        canal: item.fuenteOCanal || "YouTube",
        enlace: item.enlace,
        imagenMiniatura: item.imagen,
        etiqueta: item.categoria || "YouTube",
        descripcion: item.descripcion || `Publicado por ${item.fuenteOCanal || "YouTube"}.`,
        destacado: item.destacado || false,
        likesCount: item.likesCount || 0,
        dislikesCount: item.dislikesCount || 0,
      }));

      return {
        usuarioNombre: "Usuario",
        noticias,
        videos,
      };
    } catch (error) {
      console.error("Error al obtener datos reales del feed en ServicioDashboard:", error);
      return {
        usuarioNombre: "Usuario",
        noticias: [],
        videos: [],
      };
    }
  }
}
