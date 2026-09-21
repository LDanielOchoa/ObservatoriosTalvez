import type { APIRoute } from "astro";
import { ServicioContenidoFeed } from "../../../modules/contenido-feed/services/contenido-feed.service";

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "ID no proporcionado" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const item = await ServicioContenidoFeed.obtenerItemPorId(id);

    if (!item) {
      return new Response(
        JSON.stringify({ error: "Contenido feed no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(item), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al obtener el contenido feed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "ID no proporcionado" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const datos = await request.json();
    const itemActualizado = await ServicioContenidoFeed.actualizarItem(id, datos);

    return new Response(JSON.stringify(itemActualizado), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al actualizar el contenido feed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async ({ params }) => {
  const { id } = params;

  if (!id) {
    return new Response(JSON.stringify({ error: "ID no proporcionado" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const exito = await ServicioContenidoFeed.eliminarItem(id);

    if (exito) {
      return new Response(
        JSON.stringify({ mensaje: "Contenido feed eliminado exitosamente" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "No se pudo eliminar el contenido feed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al eliminar el contenido feed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
