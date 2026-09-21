import { defineMiddleware } from "astro:middleware";
import {
  ServicioToken,
  NOMBRE_COOKIE_SESION,
} from "./modules/auth/services/token.service";

/**
 * Rutas públicas que no requieren autenticación
 */
const RUTAS_PUBLICAS = [
  "/",
  "/red",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/red-aprendizaje/registro",
  "/api/red-aprendizaje/convocatoria",
];

/**
 * Extensiones de archivos estáticos que se omiten del middleware
 */
const EXTENSIONES_ESTATICAS = [
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".ico",
  ".webp",
  ".css",
  ".js",
  ".woff",
  ".woff2",
  ".ttf",
];

/**
 * Middleware central de seguridad y autenticación
 * - Valida la vigencia del token de sesión (20 horas)
 * - Expulsa al login si el token no existe o ha expirado
 * - Controla el acceso a rutas protegidas y privilegios administrativos
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // 1. Ignorar recursos estáticos o internos de Astro
  if (
    pathname.startsWith("/_astro") ||
    pathname.startsWith("/_image") ||
    EXTENSIONES_ESTATICAS.some((ext) => pathname.endsWith(ext))
  ) {
    return next();
  }

  // 2. Extraer token de sesión desde Cookie HTTP-Only o cabecera Authorization
  const cookieSesion = context.cookies.get(NOMBRE_COOKIE_SESION)?.value;
  const headerAuth = context.request.headers.get("Authorization");
  const tokenHeader = headerAuth?.startsWith("Bearer ")
    ? headerAuth.substring(7).trim()
    : null;

  const token = cookieSesion || tokenHeader;

  // 3. Verificar validez del token
  const resultado = ServicioToken.verificarToken(token);

  // Si el token es válido, inyectar el usuario en context.locals
  if (resultado.valido && resultado.usuario) {
    context.locals.usuario = resultado.usuario;
  }

  const esRutaPublica =
    RUTAS_PUBLICAS.includes(pathname) ||
    pathname.startsWith("/api/red-aprendizaje/registro") ||
    pathname.startsWith("/api/red-aprendizaje/convocatoria");

  // 4. Si el usuario ya cuenta con sesión válida e intenta entrar al login (/), redirigir al Dashboard
  if (pathname === "/" && resultado.valido) {
    return context.redirect("/dashboard");
  }

  // 5. Si es una ruta pública, permitir el acceso
  if (esRutaPublica) {
    return next();
  }

  // 6. Si es una ruta protegida y el token NO es válido o expiró (más de 20 horas)
  if (!resultado.valido) {
    // Si existía cookie vencida/inválida, eliminarla
    if (cookieSesion) {
      context.cookies.delete(NOMBRE_COOKIE_SESION, { path: "/" });
    }

    // Para peticiones de API, responder con 401 Unauthorized
    if (pathname.startsWith("/api/")) {
      return new Response(
        JSON.stringify({
          error: "Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.",
          expirado: resultado.razon === "expirado",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Para páginas web, redirigir al login
    const urlRedireccion =
      resultado.razon === "expirado" ? "/?sesion_expirada=1" : "/";
    return context.redirect(urlRedireccion);
  }

  // 7. Control de Acceso basado en Roles (RBAC)
  const usuario = resultado.usuario!;
  const esEstudiante =
    usuario.tipoUsuario === "estudiante" ||
    (usuario.rol && String(usuario.rol).toLowerCase() === "estudiante");

  if (esEstudiante) {
    const rutasRestringidasEstudiante = [
      "/dashboard/usuarios",
      "/dashboard/contenido-feed",
      "/dashboard/contenido-repositorio",
      "/dashboard/red-aprendizaje",
    ];

    const esRutaRestringida = rutasRestringidasEstudiante.some(
      (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
    );

    if (esRutaRestringida) {
      if (pathname.startsWith("/api/")) {
        return new Response(
          JSON.stringify({
            error: "No tienes permisos administrativos para realizar esta acción.",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
      return context.redirect("/dashboard");
    }
  }

  return next();
});
