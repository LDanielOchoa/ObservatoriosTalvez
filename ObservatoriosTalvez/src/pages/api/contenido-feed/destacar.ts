import type { APIRoute } from "astro";
import { ServicioContenidoFeed } from "../../../modules/contenido-feed/services/contenido-feed.service";
import type { TipoFeed } from "../../../modules/contenido-feed/services/contenido-feed.types";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const cuerpo = await request.json();
    const { id, tipo, destacado } = cuerpo as {
      id: string;
      tipo: TipoFeed;
      destacado: boolean;
    };

    if (!id || !tipo) {
      return new Response(
        JSON.stringify({ error: "Faltan parámetros requeridos (id, tipo)." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const exito = await ServicioContenidoFeed.establecerDestacado(id, tipo, Boolean(destacado));

    if (!exito) {
      return new Response(
        JSON.stringify({ error: "No se pudo actualizar el estado de destacado." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        exito: true,
        id,
        tipo,
        destacado: Boolean(destacado),
        mensaje: Boolean(destacado)
          ? `Contenido establecido como destacado exclusivo para ${tipo === "noticia" ? "Noticias" : "YouTube"}.`
          : `Contenido desmarcado de destacados.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error en endpoint /api/contenido-feed/destacar:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error interno al procesar destacado." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
