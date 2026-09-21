import type { APIRoute } from "astro";
import { ServicioContenidoFeed } from "../../../modules/contenido-feed/services/contenido-feed.service";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const items = await ServicioContenidoFeed.obtenerItems();
    return new Response(JSON.stringify(items), {
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const datos = await request.json();

    if (!datos.titulo || !datos.enlace || !datos.tipo) {
      return new Response(
        JSON.stringify({ error: "Título, enlace y tipo son requeridos" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const itemCreado = await ServicioContenidoFeed.crearItem(datos);
    return new Response(JSON.stringify(itemCreado), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al crear el contenido feed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Se requiere un array de IDs para la eliminación masiva" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const exito = await ServicioContenidoFeed.eliminarItemsMultiples(ids);

    if (exito) {
      return new Response(
        JSON.stringify({ mensaje: "Contenidos eliminados con éxito", total: ids.length }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "No se pudieron eliminar los contenidos" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error en la eliminación masiva" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
