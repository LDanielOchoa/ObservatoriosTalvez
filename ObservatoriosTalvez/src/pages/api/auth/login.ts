import type { APIRoute } from "astro";
import bcrypt from "bcryptjs";
import { clienteSupabase } from "../../../lib/supabase";
import { ServicioLimiteIntentosServidor } from "../../../modules/auth/services/rate-limit.service";
import {
  ServicioToken,
  NOMBRE_COOKIE_SESION,
  DURACION_TOKEN_SEGUNDOS,
} from "../../../modules/auth/services/token.service";

export const prerender = false;

const TABLA_ADMIN = "usuarios_administrativos";
const TABLA_ESTUDIANTES = "usuarios_estudiantes";

/**
 * POST /api/auth/login
 * Endpoint de validación de inicio de sesión para usuarios administrativos y estudiantes con Rate Limit y Token de 20 horas
 */
export const POST: APIRoute = async ({ request, cookies }) => {

  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "cliente_local";

    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = (body.password || body.contrasena || "").trim();

    const claveLimite = email ? `${ip}:${email}` : `${ip}:anonimo`;

    // 1. Verificar si la IP / cuenta se encuentra bloqueada por exceso de intentos
    const estadoActual = ServicioLimiteIntentosServidor.verificarEstado(claveLimite);
    if (estadoActual.bloqueado) {
      return new Response(
        JSON.stringify({
          error: `Has superado el límite de 5 intentos. Por favor, espera ${estadoActual.segundosRestantes} segundos para volver a intentar.`,
          bloqueado: true,
          segundosRestantes: estadoActual.segundosRestantes,
          intentosRestantes: 0,
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!email || !password) {
      return new Response(
        JSON.stringify({
          error: "Debes ingresar tu correo electrónico y tu contraseña.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 2. Buscar primero en usuarios administrativos
    let usuario: any = null;
    let tablaEncontrada = TABLA_ADMIN;
    let tipoUsuario: "administrativo" | "estudiante" = "administrativo";

    const admins = await clienteSupabase.consultar<any>(
      TABLA_ADMIN,
      `email=eq.${encodeURIComponent(email)}&select=*`
    );

    if (admins && admins.length > 0) {
      usuario = admins[0];
      tablaEncontrada = TABLA_ADMIN;
      tipoUsuario = "administrativo";
    } else {
      // Buscar en usuarios estudiantes
      const estudiantes = await clienteSupabase.consultar<any>(
        TABLA_ESTUDIANTES,
        `email=eq.${encodeURIComponent(email)}&select=*`
      );

      if (estudiantes && estudiantes.length > 0) {
        usuario = estudiantes[0];
        tablaEncontrada = TABLA_ESTUDIANTES;
        tipoUsuario = "estudiante";
      }
    }

    if (!usuario) {
      const fallo = ServicioLimiteIntentosServidor.registrarFallo(claveLimite);
      const mensaje = fallo.bloqueado
        ? `Has superado el límite de intentos. Por favor, espera ${fallo.segundosRestantes} segundos.`
        : "Credenciales incorrectas. Verifica tu correo y contraseña.";

      return new Response(
        JSON.stringify({
          error: mensaje,
          bloqueado: fallo.bloqueado,
          segundosRestantes: fallo.segundosRestantes,
          intentosRestantes: fallo.intentosRestantes,
        }),
        {
          status: fallo.bloqueado ? 429 : 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Validar estado de la cuenta según el tipo de usuario
    const estadoUsuario = (usuario.estado || "").toLowerCase().trim();

    if (tipoUsuario === "estudiante") {
      if (estadoUsuario === "inactivo") {
        return new Response(
          JSON.stringify({
            error: "Tu cuenta de estudiante se encuentra inactiva. Contacta al equipo del Observatorio.",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Si el estudiante no está en estado 'Activo' (por ejemplo, está 'Pendiente' de validación)
      if (estadoUsuario === "pendiente" || (estadoUsuario !== "activo" && estadoUsuario !== "")) {
        return new Response(
          JSON.stringify({
            error: "Tu cuenta de estudiante se encuentra en proceso de validación. Podrás acceder una vez sea aprobada y activada por el Observatorio.",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else {
      // Usuario Administrativo
      if (estadoUsuario === "inactivo") {
        return new Response(
          JSON.stringify({
            error: "Tu cuenta administrativa se encuentra inactiva. Contacta a un administrador principal.",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // 4. Validar contraseña con bcrypt, fallback de texto o cédula inicial
    let coincide = false;
    if (usuario.password_hash) {
      if (
        usuario.password_hash.startsWith("$2a$") ||
        usuario.password_hash.startsWith("$2b$") ||
        usuario.password_hash.startsWith("$2y$")
      ) {
        coincide = bcrypt.compareSync(password, usuario.password_hash);
      } else {
        // Fallback para contraseñas de texto plano legacy
        coincide = password === usuario.password_hash;
        if (coincide) {
          const salt = bcrypt.genSaltSync(10);
          const nuevoHash = bcrypt.hashSync(password, salt);
          clienteSupabase
            .actualizar(tablaEncontrada, usuario.id, { password_hash: nuevoHash })
            .catch(() => {});
        }
      }
    } else if (usuario.cedula) {
      // Si aún no tiene password_hash pero coincide con su número de documento / cédula inicial
      coincide = password === usuario.cedula.trim();
      if (coincide) {
        const salt = bcrypt.genSaltSync(10);
        const nuevoHash = bcrypt.hashSync(password, salt);
        clienteSupabase
          .actualizar(tablaEncontrada, usuario.id, { password_hash: nuevoHash })
          .catch(() => {});
      }
    }

    if (!coincide) {
      const fallo = ServicioLimiteIntentosServidor.registrarFallo(claveLimite);
      const mensaje = fallo.bloqueado
        ? `Has superado el límite de intentos. Por favor, espera ${fallo.segundosRestantes} segundos.`
        : "Credenciales incorrectas. Verifica tu correo y contraseña.";

      return new Response(
        JSON.stringify({
          error: mensaje,
          bloqueado: fallo.bloqueado,
          segundosRestantes: fallo.segundosRestantes,
          intentosRestantes: fallo.intentosRestantes,
        }),
        {
          status: fallo.bloqueado ? 429 : 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 5. Login exitoso: Limpiar intentos fallidos
    ServicioLimiteIntentosServidor.limpiar(claveLimite);

    // Actualizar último acceso de forma asíncrona
    clienteSupabase
      .actualizar(tablaEncontrada, usuario.id, { ultimo_acceso: "Justo ahora" })
      .catch(() => {});

    // Determinar rol exacto y perfil de sesión
    const rolFinal =
      tipoUsuario === "estudiante"
        ? "Estudiante"
        : usuario.rol || "Administrador";

    const usuarioAutenticado = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: rolFinal,
      tipoUsuario: tipoUsuario,
      universidad: usuario.universidad || undefined,
      carrera: usuario.carrera || undefined,
      semestre: usuario.semestre || undefined,
      cedula: usuario.cedula || undefined,
      estado: usuario.estado || "Activo",
    };

    // Generar token firmado con vigencia de 20 horas
    const tokenSesion = ServicioToken.generarToken(usuarioAutenticado);

    // Configurar cookie de sesión segura en el servidor
    cookies.set(NOMBRE_COOKIE_SESION, tokenSesion, {
      path: "/",
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: "lax",
      maxAge: DURACION_TOKEN_SEGUNDOS,
    });

    const mensajeBienvenida =
      tipoUsuario === "estudiante"
        ? `¡Bienvenido a la Red de Aprendizaje, ${usuario.nombre}!`
        : `Bienvenido de nuevo, ${usuario.nombre}.`;

    return new Response(
      JSON.stringify({
        exito: true,
        mensaje: mensajeBienvenida,
        usuario: usuarioAutenticado,
        token: tokenSesion,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error en endpoint /api/auth/login:", error);
    return new Response(
      JSON.stringify({
        error: "Ocurrió un error inesperado al procesar el inicio de sesión.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

