import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { clienteSupabase } from "../../../lib/supabase";

export const prerender = false;

const TABLA = "usuarios_administrativos";

/**
 * GET /api/usuarios-admin
 * Obtiene todos los usuarios administrativos
 */
export const GET: APIRoute = async () => {
  try {
    const usuarios = await clienteSupabase.consultar(
      TABLA,
      "select=*&order=fecha_creacion.desc"
    );
    return new Response(JSON.stringify(usuarios), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al obtener usuarios" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/usuarios-admin
 * Registra un nuevo usuario administrativo hasheando la contraseña con bcrypt en el servidor
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { nombre, email, password, rol, estado } = body;

    if (!nombre || !nombre.trim()) {
      return new Response(
        JSON.stringify({ error: "El nombre es obligatorio." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!email || !email.trim() || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "El correo electrónico no es válido." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!password || password.trim().length < 4) {
      return new Response(
        JSON.stringify({ error: "La contraseña debe tener al menos 4 caracteres." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hashear contraseña con bcrypt en el servidor Node.js
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password.trim(), salt);

    if (!passwordHash || !passwordHash.startsWith("$2")) {
      return new Response(
        JSON.stringify({ error: "Fallo crítico al generar el hash bcrypt de la contraseña." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      rol: rol || "Administrador",
      estado: estado || "Activo",
      ultimo_acceso: "Justo ahora",
    };

    const usuarioCreado = await clienteSupabase.insertar(TABLA, payload);

    return new Response(JSON.stringify(usuarioCreado), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al crear usuario administrativo." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/usuarios-admin
 * Eliminación masiva de usuarios administrativos
 */
export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Se requiere un array de IDs para eliminar." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await clienteSupabase.eliminarMasivo(TABLA, ids);

    return new Response(JSON.stringify({ exito: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al eliminar usuarios." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
