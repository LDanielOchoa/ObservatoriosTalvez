import type { ItemFeedAdmin, ResultadoAnalisisUrl, TipoFeed } from "./contenido-feed.types";
import { ServicioMetadatos } from "../../dashboard/services/metadatos.service";

/**
 * Servicio encargado de la gestión de contenidos Feed (Noticias y YouTube)
 */
export class ServicioContenidoFeed {
  private static items: ItemFeedAdmin[] = [
    {
      id: "feed-1",
      tipo: "noticia",
      enlace:
        "https://www.eltiempo.com/colombia/otras-ciudades/terremoto-en-colombia-hoy-viernes-21-de-agosto-ultimas-noticias-balance-de-la-emergencia-y-nuevos-temblores-en-el-pais-3579889",
      titulo:
        "Terremoto en Colombia hoy: balance de emergencia y balance de los nuevos temblores",
      descripcion:
        "Balance oficial de los organismos de socorro tras los sismos registrados en el territorio nacional durante la jornada.",
      imagen:
        "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=1200&q=80",
      fuenteOCanal: "eltiempo.com",
      fechaPublicacion: "21 de Agosto, 2026",
      categoria: "Actualidad",
      duracionOLectura: "4 min de lectura",
      estado: "Publicado",
    },
    {
      id: "feed-2",
      tipo: "noticia",
      enlace:
        "https://www.eltiempo.com/colombia/otras-ciudades/el-angustiante-llamado-de-un-campesino-en-tolima-tras-voraz-incendio-la-vaina-esta-complicada-3579928",
      titulo:
        "El angustiante llamado de un campesino en Tolima tras voraz incendio forestal",
      descripcion:
        "Comunidades rurales solicitan apoyo urgente para mitigar el impacto ambiental y proteger las cuencas hídricas.",
      imagen:
        "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1200&q=80",
      fuenteOCanal: "eltiempo.com",
      fechaPublicacion: "21 de Agosto, 2026",
      categoria: "Sostenibilidad",
      duracionOLectura: "5 min de lectura",
      estado: "Publicado",
    },
    {
      id: "feed-3",
      tipo: "noticia",
      enlace:
        "https://es.euronews.com/video/2026/08/21/mexico-las-batallas-de-aura-convierten-un-meme-viral-en-concursos-en-directo",
      titulo:
        "Las batallas de Aura convierten un fenómeno digital en eventos presenciales",
      descripcion:
        "Análisis del impacto de las dinámicas digitales en las interacciones juveniles y la apropiación comunitaria.",
      imagen:
        "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80",
      fuenteOCanal: "es.euronews.com",
      fechaPublicacion: "21 de Agosto, 2026",
      categoria: "Cultura Digital",
      duracionOLectura: "3 min de lectura",
      estado: "Publicado",
    },
    {
      id: "feed-4",
      tipo: "youtube",
      enlace: "https://www.youtube.com/watch?v=EG7myhET2TA",
      titulo:
        "Documental: Innovación social y resiliencia en comunidades sostenibles",
      descripcion:
        "Una exploración profunda sobre los proyectos de impacto social y modelos de sostenibilidad en América Latina.",
      imagen:
        "https://img.youtube.com/vi/EG7myhET2TA/maxresdefault.jpg",
      fuenteOCanal: "Canal Institucional",
      fechaPublicacion: "21 de Agosto, 2026",
      categoria: "Documental",
      duracionOLectura: "Video HD",
      estado: "Publicado",
    },
  ];

  static async obtenerItems(): Promise<ItemFeedAdmin[]> {
    return this.items;
  }

  static async obtenerItemPorId(id: string): Promise<ItemFeedAdmin | undefined> {
    return this.items.find((item) => item.id === id);
  }

  /**
   * Analiza una URL (YouTube o Noticia) extrayendo sus metadatos reales
   */
  static async analizarUrl(url: string): Promise<ResultadoAnalisisUrl> {
    const esYoutube =
      url.includes("youtube.com") || url.includes("youtu.be");

    if (esYoutube) {
      const meta = await ServicioMetadatos.extraerMetadatosYoutube(url);
      return {
        tipo: "youtube",
        enlace: url,
        titulo: meta.titulo,
        descripcion: `Contenido audiovisual publicado por ${meta.canal}.`,
        imagen: meta.imagenMiniatura,
        fuenteOCanal: meta.canal,
        fechaPublicacion: "21 de Agosto, 2026",
        categoria: "Audiovisual",
        duracionOLectura: "Video",
      };
    } else {
      const meta = await ServicioMetadatos.extraerMetadatos(url);
      const palabras = `${meta.titulo} ${meta.descripcion}`.split(/\s+/).length;
      const minutos = Math.max(3, Math.ceil(palabras / 30));

      return {
        tipo: "noticia",
        enlace: url,
        titulo: meta.titulo,
        descripcion: meta.descripcion,
        imagen: meta.imagen,
        fuenteOCanal: meta.sitio,
        fechaPublicacion: meta.fechaPublicacion || "21 de Agosto, 2026",
        categoria: "Actualidad",
        duracionOLectura: `${minutos} min de lectura`,
      };
    }
  }
}
