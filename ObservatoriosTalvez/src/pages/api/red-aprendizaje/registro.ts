import type { APIRoute } from "astro";
import { clienteSupabase } from "../../../lib/supabase";
import { ServicioInscripcionesRed } from "../../../modules/red-aprendizaje/services/inscripciones.service";

export const prerender = false;

const TABLA = "red_aprendizaje_nuevos";

/**
 * POST /api/red-aprendizaje/registro
 * Endpoint para registrar postulaciones de nuevos aspirantes a la red de aprendizaje
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Validar estado de la convocatoria
    const configConvocatoria = await ServicioInscripcionesRed.obtenerConfiguracionConvocatoria();
    if (!configConvocatoria.activo || configConvocatoria.fechaLimite) {
      return new Response(
        JSON.stringify({
          error: configConvocatoria.mensajeCierre || "El periodo de inscripciones se encuentra cerrado.",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await request.json();

    const nombre = (body.nombre || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const cedula = (body.cedula || "").trim();
    const telefono = (body.telefono || "").trim();
    const universidad = (body.universidad || "").trim();
    const carrera = (body.carrera || "").trim();
    const semestre = (body.semestre || "").trim();
    const dia = body.dia;
    const mes = (body.mes || "").trim();
    const anio = body.anio;

    // Validación de campos obligatorios
    if (
      !nombre ||
      !email ||
      !cedula ||
      !telefono ||
      !universidad ||
      !carrera ||
      !semestre ||
      !dia ||
      !mes ||
      !anio
    ) {
      return new Response(
        JSON.stringify({
          error: "Todos los campos son obligatorios para unirse a la red.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Formatear fecha de nacimiento
    const fechaNacimiento = `${dia} de ${mes}, ${anio}`;

    // Validar si ya existe un registro con la misma cédula o correo
    const existentes = await clienteSupabase.consultar<any>(
      TABLA,
      `or=(email.eq.${encodeURIComponent(email)},cedula.eq.${encodeURIComponent(cedula)})&select=id,email,cedula`
    );

    if (existentes && existentes.length > 0) {
      const duplicado = existentes[0];
      const motivo =
        duplicado.email === email
          ? "Ya existe una solicitud registrada con este correo electrónico."
          : "Ya existe una solicitud registrada con este número de cédula.";

      return new Response(
        JSON.stringify({
          error: motivo,
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Insertar registro en Supabase
    const nuevoRegistro = {
      nombre,
      email,
      cedula,
      telefono,
      fecha_nacimiento: fechaNacimiento,
      universidad,
      carrera,
      semestre,
      estado: "Pendiente",
    };

    const resultado = await clienteSupabase.insertar(TABLA, nuevoRegistro);

    return new Response(
      JSON.stringify({
        exito: true,
        mensaje: "Tu solicitud para unirte a la red ha sido enviada con éxito.",
        registro: resultado,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error al registrar participante en la red:", error);
    return new Response(
      JSON.stringify({
        error: "Ocurrió un error inesperado al procesar tu solicitud.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
