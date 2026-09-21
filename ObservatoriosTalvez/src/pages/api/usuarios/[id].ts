import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { clienteSupabase } from "../../../lib/supabase";

export const prerender = false;

const TABLA = "usuarios_estudiantes";

/**
 * GET /api/usuarios/[id]
 * Obtiene un estudiante por ID
 */
export const GET: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: "El ID es requerido." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const usuarios = await clienteSupabase.consultar<any>(
      TABLA,
      `id=eq.${id}&select=*`
    );

    if (!usuarios || usuarios.length === 0) {
      return new Response(
        JSON.stringify({ error: "Estudiante no encontrado." }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(usuarios[0]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al obtener estudiante." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * PUT /api/usuarios/[id]
 * Actualiza la información de un estudiante
 */
export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: "El ID es requerido." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const {
      nombre,
      email,
      cedula,
      telefono,
      fechaNacimiento,
      universidad,
      carrera,
      semestre,
      estado,
      password,
    } = body;

    const payload: Record<string, any> = {};

    if (nombre !== undefined) payload.nombre = nombre.trim();
    if (email !== undefined) payload.email = email.trim().toLowerCase();
    if (cedula !== undefined) payload.cedula = cedula.trim();
    if (telefono !== undefined) payload.telefono = telefono.trim();
    if (fechaNacimiento !== undefined) payload.fecha_nacimiento = fechaNacimiento;
    if (universidad !== undefined) payload.universidad = universidad.trim();
    if (carrera !== undefined) payload.carrera = carrera.trim();
    if (semestre !== undefined) payload.semestre = semestre.trim();
    if (estado !== undefined) payload.estado = estado;

    if (password && password.trim().length >= 4) {
      const salt = bcrypt.genSaltSync(10);
      payload.password_hash = bcrypt.hashSync(password.trim(), salt);
    }

    await clienteSupabase.actualizar(TABLA, id, payload);

    return new Response(JSON.stringify({ exito: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al actualizar estudiante." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

/**
 * DELETE /api/usuarios/[id]
 * Elimina un estudiante por ID
 */
export const DELETE: APIRoute = async ({ params }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ error: "El ID es requerido." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    await clienteSupabase.eliminar(TABLA, id);

    return new Response(JSON.stringify({ exito: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al eliminar estudiante." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
