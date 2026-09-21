import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { clienteSupabase } from "../../../lib/supabase";

export const prerender = false;

const TABLA_SOLICITUDES = "red_aprendizaje_nuevos";
const TABLA_ESTUDIANTES = "usuarios_estudiantes";

/**
 * Invoca la Edge Function de Supabase para notificar la bienvenida
 */
async function invocarEdgeFunctionBienvenida(datos: {
  nombre: string;
  email: string;
  cedula: string;
  universidad?: string;
  carrera?: string;
}) {
  try {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "https://gazmrklvrqajobxkblqz.supabase.co";
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "";

    const urlEdge = `${supabaseUrl}/functions/v1/enviar-correo-bienvenida`;

    const res = await fetch(urlEdge, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(datos),
    });

    if (!res.ok) {
      console.warn("Respuesta no OK de Edge Function:", await res.text());
    }
  } catch (error) {
    console.error("Error al invocar Edge Function de correo de bienvenida:", error);
  }
}

/**
 * POST /api/red-aprendizaje/decision
 * Procesa la aprobación o rechazo de una o varias solicitudes de la red
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const accion = body.accion as "Aprobado" | "Rechazado";

    if (accion !== "Aprobado" && accion !== "Rechazado") {
      return new Response(
        JSON.stringify({ error: "Acción inválida. Debe ser 'Aprobado' o 'Rechazado'." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const ids: string[] = Array.isArray(body.ids)
      ? body.ids
      : body.id
      ? [body.id]
      : [];

    if (ids.length === 0) {
      return new Response(
        JSON.stringify({ error: "Debes especificar al menos un ID de solicitud." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const procesados: string[] = [];

    for (const id of ids) {
      // 1. Obtener la solicitud actual
      const solicitudes = await clienteSupabase.consultar<any>(
        TABLA_SOLICITUDES,
        `id=eq.${id}&select=*`
      );

      if (!solicitudes || solicitudes.length === 0) {
        continue;
      }

      const solicitud = solicitudes[0];

      // 2. Actualizar el estado en red_aprendizaje_nuevos
      await clienteSupabase.actualizar(TABLA_SOLICITUDES, id, { estado: accion });

      // 3. Si es Aprobado, registrar en usuarios_estudiantes y enviar correo
      if (accion === "Aprobado") {
        const passwordHash = bcrypt.hashSync(solicitud.cedula, 10);

        // Verificar si ya existe el estudiante
        const existentes = await clienteSupabase.consultar<any>(
          TABLA_ESTUDIANTES,
          `or=(email.eq.${encodeURIComponent(solicitud.email)},cedula.eq.${encodeURIComponent(solicitud.cedula)})&select=id`
        );

        if (existentes && existentes.length > 0) {
          // Actualizar estado a Activo
          await clienteSupabase.actualizar(TABLA_ESTUDIANTES, existentes[0].id, {
            solicitud_id: solicitud.id,
            estado: "Activo",
            password_hash: passwordHash,
          });
        } else {
          // Crear nuevo estudiante
          await clienteSupabase.insertar(TABLA_ESTUDIANTES, {
            solicitud_id: solicitud.id,
            nombre: solicitud.nombre,
            email: solicitud.email,
            cedula: solicitud.cedula,
            telefono: solicitud.telefono,
            fecha_nacimiento: solicitud.fecha_nacimiento,
            universidad: solicitud.universidad,
            carrera: solicitud.carrera,
            semestre: solicitud.semestre,
            password_hash: passwordHash,
            rol: "Estudiante",
            estado: "Activo",
          });
        }

        // 4. Invocar Edge Function para enviar correo de bienvenida con credenciales
        await invocarEdgeFunctionBienvenida({
          nombre: solicitud.nombre,
          email: solicitud.email,
          cedula: solicitud.cedula,
          universidad: solicitud.universidad,
          carrera: solicitud.carrera,
        });
      }

      procesados.push(id);
    }

    const mensaje =
      accion === "Aprobado"
        ? `Se ha aprobado y enviado el correo con credenciales a ${procesados.length} aspirante(s).`
        : `Se ha rechazado la solicitud de ${procesados.length} aspirante(s).`;

    return new Response(
      JSON.stringify({
        exito: true,
        mensaje,
        procesados,
        nuevoEstado: accion,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error al procesar decisión de solicitud:", error);
    return new Response(
      JSON.stringify({
        error: "Ocurrió un error inesperado al procesar la solicitud.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
