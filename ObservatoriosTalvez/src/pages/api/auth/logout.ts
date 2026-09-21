import type { APIRoute } from "astro";
import { NOMBRE_COOKIE_SESION } from "../../../modules/auth/services/token.service";

export const prerender = false;

/**
 * POST /api/auth/logout
 * Elimina la cookie de sesión del servidor
 */
export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete(NOMBRE_COOKIE_SESION, {
    path: "/",
  });

  return new Response(
    JSON.stringify({
      exito: true,
      mensaje: "Sesión cerrada correctamente.",
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
