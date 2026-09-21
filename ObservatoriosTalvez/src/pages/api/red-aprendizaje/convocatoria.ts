import type { APIRoute } from "astro";
import { ServicioInscripcionesRed } from "../../../modules/red-aprendizaje/services/inscripciones.service";

export const prerender = false;

/**
 * GET /api/red-aprendizaje/convocatoria
 * Retorna la configuración actual del estado de la convocatoria
 */
export const GET: APIRoute = async () => {
  try {
    const config = await ServicioInscripcionesRed.obtenerConfiguracionConvocatoria();
    return new Response(JSON.stringify(config), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al obtener la configuración" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * POST /api/red-aprendizaje/convocatoria
 * Actualiza la fecha límite, estado activo y mensaje de cierre
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { fechaLimite, mensajeCierre, activo } = body;

    const configActualizada = await ServicioInscripcionesRed.guardarConfiguracionConvocatoria({
      fechaLimite: fechaLimite !== undefined ? fechaLimite : null,
      mensajeCierre: mensajeCierre || "El periodo de inscripciones para la Red de Aprendizaje ha finalizado.",
      activo: activo !== undefined ? Boolean(activo) : (fechaLimite ? false : true),
    });

    return new Response(JSON.stringify(configActualizada), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al guardar la configuración" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
