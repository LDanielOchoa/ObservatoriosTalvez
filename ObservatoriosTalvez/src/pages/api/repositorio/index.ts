import type { APIRoute } from "astro";
import { ServicioRepositorio } from "../../../modules/repositorio/services/repositorio.service";

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const documentos = await ServicioRepositorio.obtenerDocumentos();
    return new Response(JSON.stringify(documentos), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al obtener los documentos" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const datos = await request.json();

    if (!datos.titulo || !datos.lineaInvestigacion || !datos.ano || !datos.pais || !datos.tipoFuente) {
      return new Response(
        JSON.stringify({ error: "Título, línea de investigación, año, país y tipo de fuente son obligatorios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const documentoCreado = await ServicioRepositorio.crearDocumento({
      ano: String(datos.ano).trim(),
      lineaInvestigacion: datos.lineaInvestigacion.trim(),
      titulo: datos.titulo.trim(),
      tipoFuente: datos.tipoFuente.trim(),
      pais: datos.pais.trim(),
      categoria: datos.categoria ? String(datos.categoria).trim() : undefined,
      autores: Array.isArray(datos.autores) ? datos.autores : [],
      paginasWeb: Array.isArray(datos.paginasWeb)
        ? datos.paginasWeb.map((p: any) => String(p).trim()).filter(Boolean)
        : datos.enlaceDocumento
        ? [String(datos.enlaceDocumento).trim()]
        : [],
      enlaceDocumento: datos.enlaceDocumento ? datos.enlaceDocumento.trim() : undefined,
      resumen: datos.resumen ? datos.resumen.trim() : undefined,
      referenciaApa: datos.referenciaApa ? datos.referenciaApa.trim() : undefined,
    });

    return new Response(JSON.stringify(documentoCreado), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al crear el documento" }),
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
        JSON.stringify({ error: "Se requiere un arreglo de IDs para la eliminación masiva" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const exito = await ServicioRepositorio.eliminarDocumentosMasivo(ids);

    if (exito) {
      return new Response(
        JSON.stringify({ mensaje: "Documentos eliminados exitosamente", total: ids.length }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({ error: "No se pudieron eliminar los documentos" }),
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
