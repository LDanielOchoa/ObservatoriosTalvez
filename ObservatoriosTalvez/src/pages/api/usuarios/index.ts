import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { clienteSupabase } from "../../../lib/supabase";

export const prerender = false;

const TABLA = "usuarios_estudiantes";

/**
 * GET /api/usuarios
 * Obtiene todos los estudiantes registrados
 */
export const GET: APIRoute = async () => {
  try {
    const usuarios = await clienteSupabase.consultar(
      TABLA,
      "select=*&order=created_at.desc"
    );
    return new Response(JSON.stringify(usuarios), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al obtener estudiantes" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * POST /api/usuarios
 * Registra un nuevo usuario estudiante hasheando la contraseña (por defecto la cédula)
 */
export const POST: APIRoute = async ({ request }) => {
  try {
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

    if (!cedula || !cedula.trim()) {
      return new Response(
        JSON.stringify({ error: "La cédula es obligatoria." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verificar si ya existe un estudiante con esa cédula o correo
    const existentes = await clienteSupabase.consultar<any>(
      TABLA,
      `or=(email.eq.${encodeURIComponent(email.trim().toLowerCase())},cedula.eq.${encodeURIComponent(cedula.trim())})&select=id`
    );

    if (existentes && existentes.length > 0) {
      return new Response(
        JSON.stringify({ error: "Ya existe un estudiante registrado con este correo o cédula." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generar hash de contraseña (la contraseña inicial es la cédula si no se especifica otra)
    const claveAHashear = password && password.trim() ? password.trim() : cedula.trim();
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(claveAHashear, salt);

    const payload = {
      nombre: nombre.trim(),
      email: email.trim().toLowerCase(),
      cedula: cedula.trim(),
      telefono: telefono ? telefono.trim() : "",
      fecha_nacimiento: fechaNacimiento || "",
      universidad: universidad ? universidad.trim() : "",
      carrera: carrera ? carrera.trim() : "",
      semestre: semestre ? semestre.trim() : "",
      password_hash: passwordHash,
      rol: "Estudiante",
      estado: estado || "Activo",
    };

    const usuarioCreado = await clienteSupabase.insertar(TABLA, payload);

    return new Response(JSON.stringify(usuarioCreado), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Error al crear estudiante." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/**
 * DELETE /api/usuarios
 * Eliminación masiva de usuarios estudiantes
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
      JSON.stringify({ error: error.message || "Error al eliminar estudiantes." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
