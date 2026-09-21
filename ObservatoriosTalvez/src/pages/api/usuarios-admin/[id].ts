import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { clienteSupabase } from "../../../lib/supabase";

export const prerender = false;

const TABLA = "usuarios_administrativos";

/**
 * PATCH /api/usuarios-admin/[id]
 * Actualiza un usuario administrativo hasheando la nueva contraseña en el servidor si se proporciona
 */
export const PATCH: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "ID no provisto" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const payload: Record<string, any> = {};

    if (body.nombre !== undefined) payload.nombre = body.nombre.trim();
    if (body.email !== undefined) payload.email = body.email.trim().toLowerCase();
    if (body.rol !== undefined) payload.rol = body.rol;
    if (body.estado !== undefined) payload.estado = body.estado;

    if (body.password && body.password.trim().length > 0) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(body.password.trim(), salt);
      payload.password_hash = passwordHash;
    }

    const usuarioActualizado = await clienteSupabase.actualizar(TABLA, id, payload);

    return new Response(JSON.stringify(usuarioActualizado), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al actualizar usuario" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/usuarios-admin/[id]
 * Elimina un usuario administrativo por ID
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(JSON.stringify({ error: "ID no provisto" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await clienteSupabase.eliminar(TABLA, id);

    return new Response(JSON.stringify({ exito: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al eliminar usuario" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
