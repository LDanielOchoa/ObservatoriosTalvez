import { useEffect } from "react";
import { Toast, toast } from "@heroui/react";

interface Props {
  formId: string;
  successTitle: string;
  successDescription: string;
}

export default function FormToasts({
  formId,
  successTitle,
  successDescription,
}: Props) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;

    form.setAttribute("novalidate", "");

    const onSubmit = (e: Event) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        toast.danger("Campos incompletos", {
          description: "Completa todos los campos para continuar.",
        });
        return;
      }
      toast.success(successTitle, { description: successDescription });
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [formId, successTitle, successDescription]);

  return <Toast.Provider placement="top" />;
}
