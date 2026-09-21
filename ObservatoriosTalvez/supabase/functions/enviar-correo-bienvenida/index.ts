import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import nodemailer from "npm:nodemailer@6.9.13";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nombre, email, cedula, universidad, carrera } = await req.json();

    if (!email || !nombre) {
      return new Response(
        JSON.stringify({ error: "Faltan datos obligatorios (email, nombre)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Configuración SMTP para Zoho Mail
    const transporter = nodemailer.createTransport({
      host: Deno.env.get("SMTP_HOST") || "smtp.zoho.com",
      port: Number(Deno.env.get("SMTP_PORT") || 465),
      secure: true,
      auth: {
        user: Deno.env.get("SMTP_USER") || "Red@observatoriors.com",
        pass: Deno.env.get("SMTP_PASS") || "EiMSdGn02E4a",
      },
    });

    const asunto = "Notificación de Admisión - Red de Aprendizaje";
    const senderEmail = Deno.env.get("EMAIL_FROM") || "Observatorio de Responsabilidad Social <Red@observatoriors.com>";

    // Plantilla HTML oficial del Observatorio
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Notificación de Admisión</title>
</head>

<body style="
  margin: 0;
  padding: 24px 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #222222;
  line-height: 1.6;
">

  <table
    align="center"
    border="0"
    cellpadding="0"
    cellspacing="0"
    width="100%"
    style="
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    "
  >

    <!-- Encabezado con imagen y textos centrados -->
    <tr>
      <td
        align="center"
        style="
          padding: 32px 40px 24px 40px;
          border-bottom: 1px solid #e5e5e5;
          text-align: center;
        "
      >
        <img
          src="https://cdn.phototourl.com/free/2026-09-17-2fa4f239-5e78-4849-8777-4768e6560c67.png"
          alt="Observatorio de Responsabilidad Social y Sostenibilidad"
          width="150"
          style="
            display: block;
            margin: 0 auto;
            max-width: 150px;
            height: auto;
            border: 0;
            outline: none;
          "
        >

        <p style="
          margin: 14px 0 0 0;
          font-size: 14px;
          font-weight: 600;
          color: #222222;
          text-align: center;
        ">
          Observatorio de Responsabilidad Social y Sostenibilidad
        </p>

        <p style="
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #777777;
          text-align: center;
        ">
          Red de Aprendizaje
        </p>
      </td>
    </tr>

    <!-- Contenido -->
    <tr>
      <td style="padding: 36px 40px;">
        <p style="
          margin: 0 0 20px 0;
          font-size: 15px;
          color: #333333;
        ">
          Hola <strong>${nombre}</strong>,
        </p>

        <p style="
          margin: 0 0 18px 0;
          font-size: 14px;
          color: #444444;
        ">
          Tu solicitud para ingresar a la <strong>Red de Aprendizaje</strong>
          fue aprobada.
        </p>

        <p style="
          margin: 0 0 20px 0;
          font-size: 14px;
          color: #444444;
        ">
          Estos son tus datos para ingresar a la plataforma:
        </p>

        <!-- Credenciales -->
        <table
          border="0"
          cellpadding="0"
          cellspacing="0"
          width="100%"
          style="
            border-top: 1px solid #dddddd;
            border-bottom: 1px solid #dddddd;
            margin: 0 0 20px 0;
          "
        >
          <tr>
            <td style="
              padding: 13px 0;
              width: 42%;
              font-size: 13px;
              color: #777777;
              border-bottom: 1px solid #eeeeee;
            ">
              Correo
            </td>
            <td style="
              padding: 13px 0;
              font-size: 13px;
              color: #222222;
              font-weight: 600;
              border-bottom: 1px solid #eeeeee;
              word-break: break-word;
            ">
              ${email}
            </td>
          </tr>

          <tr>
            <td style="
              padding: 13px 0;
              font-size: 13px;
              color: #777777;
              border-bottom: 1px solid #eeeeee;
            ">
              Contraseña
            </td>
            <td style="
              padding: 13px 0;
              font-size: 13px;
              color: #222222;
              font-weight: 600;
              font-family: monospace;
              border-bottom: 1px solid #eeeeee;
            ">
              ${cedula || "Tu número de cédula"}
            </td>
          </tr>
        </table>

        <!-- Firma -->
        <p style="
          margin: 0;
          font-size: 14px;
          color: #444444;
        ">
          Saludos,
        </p>

        <p style="
          margin: 5px 0 0 0;
          font-size: 14px;
          font-weight: 600;
          color: #222222;
        ">
          Observatorio de Responsabilidad Social y Sostenibilidad
        </p>

        <p style="
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #777777;
        ">
          Red de Aprendizaje
        </p>
      </td>
    </tr>

    <!-- Pie -->
    <tr>
      <td style="
        padding: 18px 40px;
        border-top: 1px solid #e5e5e5;
        text-align: center;
        font-size: 11px;
        color: #999999;
      ">
        Mensaje generado automáticamente. Por favor, no respondas a este correo.
      </td>
    </tr>

  </table>

</body>
</html>
    `;

    // Envío del correo mediante Zoho SMTP
    await transporter.sendMail({
      from: senderEmail,
      to: email,
      subject: asunto,
      html: html,
    });

    // Guardado en la base de datos registro_correos_red
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      await supabase.from("registro_correos_red").insert({
        email_destinatario: email,
        nombre_destinatario: nombre,
        asunto: asunto,
        contenido_html: html,
        tipo: "Aceptacion",
        estado_envio: "Enviado",
        fecha_envio: new Date().toISOString(),
      });
    }

    return new Response(
      JSON.stringify({ exito: true, mensaje: "Correo enviado exitosamente vía Zoho" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error al despachar correo con Zoho:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Error al enviar correo" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
