"use client";

import React, { useEffect, useRef } from "react";
import { Toast, toast } from "@heroui/react";
import { ServicioAutenticacion } from "../modules/auth/services/auth.service";
import { ServicioLimiteIntentosCliente } from "../modules/auth/services/rate-limit-client.service";
import { ServicioRedAprendizaje } from "../modules/red-aprendizaje/services/red.service";


interface Props {
  formId: string;
  successTitle: string;
  successDescription: string;
  redirectUrl?: string;
}

export default function FormToasts({
  formId,
  successTitle,
  successDescription,
  redirectUrl,
}: Props) {
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    form.setAttribute("novalidate", "");

    const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    const btnContent = form.querySelector("#btn-login-content, #btn-register-content") as HTMLElement | null;
    const btnLoader = form.querySelector("#btn-login-loader, #btn-register-loader") as HTMLElement | null;
    const btnBlocked = form.querySelector("#btn-login-blocked") as HTMLElement | null;
    const btnBlockedText = form.querySelector("#btn-login-blocked-text") as HTMLElement | null;
    const inputs = form.querySelectorAll(
      "input, button:not([type='submit']), select"
    ) as NodeListOf<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>;

    const restaurarFormulario = () => {
      inputs.forEach((input) => {
        input.disabled = false;
      });
      if (submitBtn) {
        submitBtn.disabled = false;
      }
      if (btnContent) {
        btnContent.classList.remove("hidden");
        btnContent.classList.add("flex");
      }
      if (btnLoader) {
        btnLoader.classList.add("hidden");
        btnLoader.classList.remove("flex");
      }
      if (btnBlocked) {
        btnBlocked.classList.add("hidden");
        btnBlocked.classList.remove("flex");
      }
    };

    const iniciarCuentaRegresivaBloqueo = (segundosIniciales: number) => {
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }

      // Bloquear formulario
      inputs.forEach((input) => {
        input.disabled = true;
      });
      if (submitBtn) {
        submitBtn.disabled = true;
      }
      if (btnContent) {
        btnContent.classList.add("hidden");
        btnContent.classList.remove("flex");
      }
      if (btnLoader) {
        btnLoader.classList.add("hidden");
        btnLoader.classList.remove("flex");
      }
      if (btnBlocked) {
        btnBlocked.classList.remove("hidden");
        btnBlocked.classList.add("flex");
      }

      let segundos = segundosIniciales;
      if (btnBlockedText) {
        btnBlockedText.textContent = `Espera ${segundos}s...`;
      }

      intervaloRef.current = setInterval(() => {
        segundos -= 1;
        if (segundos <= 0) {
          if (intervaloRef.current) {
            clearInterval(intervaloRef.current);
            intervaloRef.current = null;
          }
          ServicioLimiteIntentosCliente.reiniciar();
          restaurarFormulario();
          toast.info("Límite restablecido", {
            description: "Puedes volver a intentar iniciar sesión.",
          });
        } else if (btnBlockedText) {
          btnBlockedText.textContent = `Espera ${segundos}s...`;
        }
      }, 1000);
    };

    // Verificar al cargar la página si ya está bloqueado o si la sesión expiró
    if (formId === "form-login") {
      if (typeof window !== "undefined" && window.location.search.includes("sesion_expirada=1")) {
        localStorage.removeItem("observatorio_usuario_sesion");
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => {
          toast.warning("Sesión Expirada", {
            description: "Tu sesión de 20 horas ha finalizado. Inicia sesión nuevamente para continuar.",
          });
        }, 150);
      }

      const estado = ServicioLimiteIntentosCliente.verificarEstado();
      if (estado.bloqueado && estado.segundosRestantes > 0) {
        iniciarCuentaRegresivaBloqueo(estado.segundosRestantes);
        toast.danger("Acceso bloqueado", {
          description: `Has superado el límite de intentos. Espera ${estado.segundosRestantes} segundos.`,
        });
      }
    }


    const onSubmit = async (e: Event) => {
      e.preventDefault();

      // Si está bloqueado no permitir envío
      if (formId === "form-login") {
        const estado = ServicioLimiteIntentosCliente.verificarEstado();
        if (estado.bloqueado) {
          toast.danger("Espera un momento", {
            description: `Debes esperar ${estado.segundosRestantes} segundos antes de reintentar.`,
          });
          return;
        }
      }

      if (!form.checkValidity()) {
        toast.danger("Campos incompletos", {
          description: "Completa todos los campos para continuar.",
        });
        return;
      }

      // Extraer datos del formulario antes de deshabilitar inputs
      const formData = new FormData(form);

      // Bloqueo temporal durante la petición
      inputs.forEach((input) => {
        input.disabled = true;
      });
      if (submitBtn) {
        submitBtn.disabled = true;
      }
      if (btnContent && btnLoader) {
        btnContent.classList.add("hidden");
        btnContent.classList.remove("flex");
        btnLoader.classList.remove("hidden");
        btnLoader.classList.add("flex");
      }

      try {
        if (formId === "form-login") {
          const email = String(formData.get("email") || "");
          const password = String(formData.get("password") || "");

          const respuesta = await ServicioAutenticacion.iniciarSesion({
            email,
            contrasena: password,
          });

          if (!respuesta.exito) {
            toast.danger("Acceso Denegado", {
              description: respuesta.mensaje || "Credenciales incorrectas.",
            });

            if (respuesta.bloqueado && respuesta.segundosRestantes) {
              iniciarCuentaRegresivaBloqueo(respuesta.segundosRestantes);
            } else {
              restaurarFormulario();
            }
            return;
          }

          let tituloNotificacion = successTitle;
          let descripcionNotificacion = successDescription;

          if (respuesta.usuario) {
            const esEstudiante = respuesta.usuario.tipoUsuario === "estudiante";
            tituloNotificacion = `¡Hola, ${respuesta.usuario.nombre}!`;
            descripcionNotificacion = esEstudiante
              ? "Accediendo al Observatorio..."
              : "Accediendo al Observatorio...";
          }

          toast.success(tituloNotificacion, { description: descripcionNotificacion });
        } else if (formId === "form-register") {
          const nombre = String(formData.get("nombre") || "");
          const email = String(formData.get("email") || "");
          const cedula = String(formData.get("cedula") || "");
          const telefono = String(formData.get("telefono") || "");
          const dia = Number(formData.get("dia") || 0);
          const mes = String(formData.get("mes") || "");
          const anio = Number(formData.get("anio") || 0);
          const universidad = String(formData.get("universidad") || "");
          const semestre = String(formData.get("semestre") || "");
          const carrera = String(formData.get("carrera") || "");

          const respuesta = await ServicioRedAprendizaje.registrarParticipante({
            nombre,
            email,
            cedula,
            telefono,
            dia,
            mes,
            anio,
            universidad,
            semestre,
            carrera,
          });

          if (!respuesta.exito) {
            toast.danger("No se pudo completar el registro", {
              description: respuesta.mensaje || "Verifica los datos ingresados.",
            });
            restaurarFormulario();
            return;
          }

          form.reset();
          toast.success(successTitle, { description: successDescription });
        } else {
          // Breve delay para otros formularios genéricos
          await new Promise((resolve) => setTimeout(resolve, 800));
          toast.success(successTitle, { description: successDescription });
        }

        if (redirectUrl) {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 600);
        } else {
          restaurarFormulario();
        }
      } catch (error) {
        toast.danger("Error de conexión", {
          description: "Ocurrió un error inesperado al procesar la solicitud.",
        });
        restaurarFormulario();
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => {
      form.removeEventListener("submit", onSubmit);
      if (intervaloRef.current) {
        clearInterval(intervaloRef.current);
      }
    };
  }, [formId, successTitle, successDescription, redirectUrl]);

  return <Toast.Provider placement="top" />;
}

