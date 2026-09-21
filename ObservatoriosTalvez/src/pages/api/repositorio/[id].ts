import type { APIRoute } from "astro";
import { ServicioRepositorio } from "../../../modules/repositorio/services/repositorio.service";

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
    const documento = await ServicioRepositorio.obtenerDocumentoPorId(id);

    if (!documento) {
      return new Response(
        JSON.stringify({ error: "Documento no encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(documento), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al obtener el documento" }),
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
    const documentoActualizado = await ServicioRepositorio.actualizarDocumento(id, datos);

    return new Response(JSON.stringify(documentoActualizado), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al actualizar el documento" }),
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
    const exito = await ServicioRepositorio.eliminarDocumento(id);

    if (exito) {
      return new Response(
        JSON.stringify({ mensaje: "Documento eliminado exitosamente" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "No se pudo eliminar el documento" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al eliminar el documento" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
