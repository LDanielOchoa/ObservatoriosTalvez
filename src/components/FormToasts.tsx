import { useEffect } from "react";
import { Toast, toast } from "@heroui/react";

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
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    form.setAttribute("novalidate", "");

    const onSubmit = async (e: Event) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        toast.danger("Campos incompletos", {
          description: "Completa todos los campos para continuar.",
        });
        return;
      }

      // Elementos interactivos del formulario
      const submitBtn = form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
      const btnContent = form.querySelector("#btn-login-content") as HTMLElement | null;
      const btnLoader = form.querySelector("#btn-login-loader") as HTMLElement | null;
      const inputs = form.querySelectorAll("input, button:not([type='submit']), select") as NodeListOf<HTMLInputElement | HTMLButtonElement | HTMLSelectElement>;

      // Bloqueo de campos y botón
      inputs.forEach((input) => {
        input.disabled = true;
      });
      if (submitBtn) {
        submitBtn.disabled = true;
      }

      // Activar microanimación de loader
      if (btnContent && btnLoader) {
        btnContent.classList.add("hidden");
        btnContent.classList.remove("flex");
        btnLoader.classList.remove("hidden");
        btnLoader.classList.add("flex");
      }

      try {
        // Simulación de validación y análisis de credenciales
        await new Promise((resolve) => setTimeout(resolve, 1500));

        toast.success(successTitle, { description: successDescription });

        if (redirectUrl) {
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 800);
        } else {
          // Si no hay redirección, restablecemos los campos
          inputs.forEach((input) => {
            input.disabled = false;
          });
          if (submitBtn) {
            submitBtn.disabled = false;
          }
          if (btnContent && btnLoader) {
            btnContent.classList.remove("hidden");
            btnContent.classList.add("flex");
            btnLoader.classList.add("hidden");
            btnLoader.classList.remove("flex");
          }
        }
      } catch (error) {
        toast.danger("Error", {
          description: "Ocurrió un error inesperado al procesar la solicitud.",
        });
        inputs.forEach((input) => {
          input.disabled = false;
        });
        if (submitBtn) {
          submitBtn.disabled = false;
        }
        if (btnContent && btnLoader) {
          btnContent.classList.remove("hidden");
          btnContent.classList.add("flex");
          btnLoader.classList.add("hidden");
          btnLoader.classList.remove("flex");
        }
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [formId, successTitle, successDescription, redirectUrl]);

  return <Toast.Provider placement="top" />;
}
