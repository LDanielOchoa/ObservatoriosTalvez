import type { MetadatosUrl } from "./dashboard.types";

/**
 * Servicio encargado de extraer dinámicamente metadatos Open Graph,
 * Twitter Cards, oEmbed y etiquetas HTML desde cualquier URL provista (Noticias o YouTube).
 */
export class ServicioMetadatos {
  /**
   * Extrae metadatos de videos de YouTube usando la API oficial oEmbed y fallback a thumbnails HD
   */
  static async extraerMetadatosYoutube(url: string): Promise<{
    titulo: string;
    canal: string;
    imagenMiniatura: string;
    enlace: string;
  }> {
    try {
      // Extraer ID del video
      const urlObj = new URL(url);
      let videoId = urlObj.searchParams.get("v");
      if (!videoId && urlObj.hostname.includes("youtu.be")) {
        videoId = urlObj.pathname.replace(/^\//, "");
      }

      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const respuesta = await fetch(oembedUrl);

      if (respuesta.ok) {
        const data = await respuesta.json();
        const thumbnail =
          (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "") ||
          data.thumbnail_url ||
          (videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : "");

        return {
          titulo: data.title || "Video de YouTube",
          canal: data.author_name || "YouTube",
          imagenMiniatura: thumbnail,
          enlace: url,
        };
      }
    } catch (error) {
      console.warn(`[ServicioMetadatos] Error al extraer oEmbed de YouTube (${url}):`, error);
    }

    // Fallback con ID
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const id = match ? match[1] : "";

    return {
      titulo: "Video en YouTube",
      canal: "YouTube",
      imagenMiniatura: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "",
      enlace: url,
    };
  }

  /**
   * Extrae metadatos de artículos de noticias y páginas web generales
   */
  static async extraerMetadatos(url: string): Promise<MetadatosUrl> {
    try {
      const respuesta = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        },
      });

      if (!respuesta.ok) {
        throw new Error(`Error HTTP al obtener URL: ${respuesta.status}`);
      }

      const html = await respuesta.text();

      const obtenerMeta = (propiedad: string): string => {
        const regexes = [
          new RegExp(`<meta[^>]*property=["'](?:og:|twitter:)?${propiedad}["'][^>]*content=["']([^"']*)["']`, "i"),
          new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["'](?:og:|twitter:)?${propiedad}["']`, "i"),
          new RegExp(`<meta[^>]*name=["'](?:og:|twitter:)?${propiedad}["'][^>]*content=["']([^"']*)["']`, "i"),
          new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["'](?:og:|twitter:)?${propiedad}["']`, "i"),
        ];

        for (const regex of regexes) {
          const match = html.match(regex);
          if (match && match[1]) {
            return match[1].trim();
          }
        }
        return "";
      };

      const tituloTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const tituloBruto =
        obtenerMeta("title") ||
        (tituloTag && tituloTag[1] ? tituloTag[1] : "");

      const descripcionBruto =
        obtenerMeta("description");

      const imagen = obtenerMeta("image");
      const sitio =
        obtenerMeta("site_name") ||
        new URL(url).hostname.replace(/^www\./, "");

      const fechaPublicacion =
        obtenerMeta("article:published_time") ||
        obtenerMeta("published_time") ||
        obtenerMeta("date");

      const decodificar = (texto: string) =>
        texto
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");

      return {
        titulo: decodificar(tituloBruto),
        descripcion: decodificar(descripcionBruto),
        imagen: imagen || undefined,
        sitio,
        fechaPublicacion: fechaPublicacion ? fechaPublicacion.split("T")[0] : undefined,
      };
    } catch (error) {
      console.warn(`[ServicioMetadatos] No se pudieron extraer metadatos de ${url}:`, error);
      const nombreDominio = (() => {
        try {
          return new URL(url).hostname.replace(/^www\./, "");
        } catch {
          return "Enlace";
        }
      })();

      return {
        titulo: "Artículo de información y actualidad",
        descripcion: "Haz clic en el enlace para leer los detalles completos de esta publicación.",
        sitio: nombreDominio,
      };
    }
  }
}
