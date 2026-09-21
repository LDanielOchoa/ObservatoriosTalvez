import type { APIRoute } from "astro";
import { ServicioContenidoFeed } from "../../modules/contenido-feed/services/contenido-feed.service";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const urlObj = new URL(request.url);
    const targetUrl = urlObj.searchParams.get("url");

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "URL no provista" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resultado = await ServicioContenidoFeed.analizarUrl(targetUrl);

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "No se pudo analizar la URL" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const targetUrl = body.url;

    if (!targetUrl) {
      return new Response(JSON.stringify({ error: "URL no provista" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resultado = await ServicioContenidoFeed.analizarUrl(targetUrl);

    return new Response(JSON.stringify(resultado), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "No se pudo analizar la URL" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
