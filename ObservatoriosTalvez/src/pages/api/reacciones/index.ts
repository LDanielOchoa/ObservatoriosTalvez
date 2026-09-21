import type { APIRoute } from "astro";
import { clienteSupabase } from "../../../lib/supabase";

export const prerender = false;

const TABLA_REACCIONES = "interacciones_reacciones";
const TABLA_FEED = "contenido_feed";
const TABLA_REPOSITORIO = "documentos_repositorio";

/**
 * GET /api/reacciones?tipoContenido=feed&usuarioId=...
 * Obtiene las reacciones registradas por un usuario o las cuentas de un item
 */
export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const tipoContenido = url.searchParams.get("tipoContenido");
    const usuarioId = url.searchParams.get("usuarioId");
    const contenidoId = url.searchParams.get("contenidoId");

    let queryParams = "select=*";
    if (tipoContenido) queryParams += `&tipo_contenido=eq.${tipoContenido}`;
    if (contenidoId) queryParams += `&contenido_id=eq.${contenidoId}`;
    if (usuarioId) queryParams += `&usuario_id=eq.${encodeURIComponent(usuarioId)}`;

    const registros = await clienteSupabase.consultar<any>(TABLA_REACCIONES, queryParams);

    return new Response(JSON.stringify({ exito: true, datos: registros || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error al consultar reacciones:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al consultar reacciones" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * POST /api/reacciones
 * Registra, actualiza o desmarca un Like/Dislike para un contenido de feed o repositorio
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { tipoContenido, contenidoId, reaccion, usuarioId, usuarioEmail } = body;

    if (!tipoContenido || !contenidoId || !reaccion) {
      return new Response(
        JSON.stringify({ error: "Faltan parámetros obligatorios (tipoContenido, contenidoId, reaccion)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const idUsuarioClave = usuarioId || usuarioEmail || "anonimo";
    const tablaDestino = tipoContenido === "repositorio" ? TABLA_REPOSITORIO : TABLA_FEED;

    // 1. Verificar si ya existe una reacción de este usuario para este contenido
    const existentes = await clienteSupabase.consultar<any>(
      TABLA_REACCIONES,
      `tipo_contenido=eq.${tipoContenido}&contenido_id=eq.${contenidoId}&usuario_id=eq.${encodeURIComponent(idUsuarioClave)}`
    );

    let reaccionFinal: "like" | "dislike" | null = null;
    let deltaLikes = 0;
    let deltaDislikes = 0;

    if (existentes && existentes.length > 0) {
      const registroActual = existentes[0];
      if (registroActual.reaccion === reaccion) {
        // Mismo botón -> Toggle / Desmarcar
        await clienteSupabase.eliminar(TABLA_REACCIONES, registroActual.id);
        reaccionFinal = null;
        if (reaccion === "like") deltaLikes = -1;
        if (reaccion === "dislike") deltaDislikes = -1;
      } else {
        // Cambiar de like a dislike o viceversa
        await clienteSupabase.actualizar(TABLA_REACCIONES, registroActual.id, {
          reaccion: reaccion,
          actualizado_en: new Date().toISOString(),
        });
        reaccionFinal = reaccion;
        if (reaccion === "like") {
          deltaLikes = 1;
          deltaDislikes = -1;
        } else {
          deltaLikes = -1;
          deltaDislikes = 1;
        }
      }
    } else {
      // Nueva reacción
      await clienteSupabase.insertar(TABLA_REACCIONES, {
        tipo_contenido: tipoContenido,
        contenido_id: contenidoId,
        usuario_id: idUsuarioClave,
        usuario_email: usuarioEmail || null,
        reaccion: reaccion,
      });
      reaccionFinal = reaccion;
      if (reaccion === "like") deltaLikes = 1;
      if (reaccion === "dislike") deltaDislikes = 1;
    }

    // 2. Actualizar contadores en la tabla del contenido
    const itemsActuales = await clienteSupabase.consultar<any>(
      tablaDestino,
      `id=eq.${contenidoId}&select=*`
    );
    const itemActual = itemsActuales && itemsActuales.length > 0 ? itemsActuales[0] : null;
    let nuevosLikes = 0;
    let nuevosDislikes = 0;

    if (itemActual) {
      nuevosLikes = Math.max(0, (Number(itemActual.likes_count) || 0) + deltaLikes);
      nuevosDislikes = Math.max(0, (Number(itemActual.dislikes_count) || 0) + deltaDislikes);

      await clienteSupabase.actualizar(tablaDestino, contenidoId, {
        likes_count: nuevosLikes,
        dislikes_count: nuevosDislikes,
      });
    }

    return new Response(
      JSON.stringify({
        exito: true,
        reaccionActual: reaccionFinal,
        likesCount: nuevosLikes,
        dislikesCount: nuevosDislikes,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error al procesar reacción:", error);
    return new Response(
      JSON.stringify({ error: "Error interno al procesar reacción" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
