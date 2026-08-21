"use client";

import React, { useState, useMemo } from "react";
import { Tabs, Table, Toast, toast } from "@heroui/react";
import {
  LetterIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  RoundedMagnifierZoomInIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  EyeIcon,
  LaptopIcon,
  SendSquareIcon,
  Pen2Icon,
} from "@solar-icons/react/outline";
import type { CorreoEnviado, PlantillaRed } from "../services/correos.types";
import { ServicioCorreosRed } from "../services/correos.service";

interface Props {
  correosIniciales: CorreoEnviado[];
  plantillaInicial: PlantillaRed;
}

// Convertidor Markdown a HTML para la vista previa del correo y web
function parsearMarkdownAHtml(markdown: string): string {
  if (!markdown) return "";

  const html = markdown
    .replace(/\{\{nombre\}\}/g, "Mariana Lucía Henao")
    .replace(/\{\{carrera\}\}/g, "Negocios Internacionales")
    .replace(/\{\{universidad\}\}/g, "Universidad EAFIT")
    .replace(/\{\{fecha\}\}/g, "21 de Agosto, 2026")
    .replace(/\{\{token\}\}/g, "demo_token_123");

  const lineas = html.split("\n");
  const lineasProcesadas: string[] = [];
  let enLista = false;

  for (const linea of lineas) {
    const l = linea.trim();

    if (l.startsWith("### ")) {
      if (enLista) {
        lineasProcesadas.push("</ul>");
        enLista = false;
      }
      lineasProcesadas.push(
        `<h3 style="margin: 16px 0 8px 0; font-size: 15px; font-weight: 700; color: #0064c1;">${l.slice(4)}</h3>`
      );
      continue;
    }
    if (l.startsWith("## ")) {
      if (enLista) {
        lineasProcesadas.push("</ul>");
        enLista = false;
      }
      lineasProcesadas.push(
        `<h2 style="margin: 18px 0 10px 0; font-size: 17px; font-weight: 700; color: #0a0a0a;">${l.slice(3)}</h2>`
      );
      continue;
    }
    if (l.startsWith("# ")) {
      if (enLista) {
        lineasProcesadas.push("</ul>");
        enLista = false;
      }
      lineasProcesadas.push(
        `<h1 style="margin: 20px 0 12px 0; font-size: 20px; font-weight: 800; color: #0a0a0a;">${l.slice(2)}</h1>`
      );
      continue;
    }

    if (l.startsWith("- ") || l.startsWith("* ")) {
      if (!enLista) {
        lineasProcesadas.push(
          '<ul style="margin: 8px 0 16px 0; padding-left: 20px; font-size: 13px; color: #4b5563; line-height: 1.7;">'
        );
        enLista = true;
      }
      const itemTexto = l.slice(2);
      lineasProcesadas.push(`<li>${procesarFormatoEnLinea(itemTexto)}</li>`);
      continue;
    }

    if (enLista && l === "") {
      lineasProcesadas.push("</ul>");
      enLista = false;
      continue;
    }

    if (l !== "") {
      if (enLista) {
        lineasProcesadas.push("</ul>");
        enLista = false;
      }
      lineasProcesadas.push(
        `<p style="margin: 0 0 12px 0; font-size: 14px; line-height: 1.6; color: #374151;">${procesarFormatoEnLinea(l)}</p>`
      );
    }
  }

  if (enLista) {
    lineasProcesadas.push("</ul>");
  }

  return lineasProcesadas.join("");
}

function procesarFormatoEnLinea(texto: string): string {
  return texto
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" style="color: #0064c1; text-decoration: underline;">$1</a>'
    );
}

export const GestionCorreosRed: React.FC<Props> = ({
  correosIniciales,
  plantillaInicial,
}) => {
  const [tabActiva, setTabActiva] = useState<string>("historial");
  const [correos, setCorreos] = useState<CorreoEnviado[]>(correosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const filasPorPagina = 8;

  // Estado de la Plantilla Única
  const [plantilla, setPlantilla] = useState<PlantillaRed>(plantillaInicial);
  const [vistaTemplate, setVistaTemplate] = useState<"correo" | "web">("correo");

  // Formulario de Envío de Prueba
  const [emailPrueba, setEmailPrueba] = useState("usuario.aspirante@observatorio.edu.co");
  const [asuntoPrueba, setAsuntoPrueba] = useState(plantillaInicial.asunto);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);

  // Filtrado de historial
  const correosFiltrados = useMemo(() => {
    const termino = busqueda.toLowerCase().trim();
    if (!termino) return correos;
    return correos.filter(
      (c) =>
        c.destinatarioNombre.toLowerCase().includes(termino) ||
        c.destinatarioEmail.toLowerCase().includes(termino) ||
        c.asunto.toLowerCase().includes(termino)
    );
  }, [correos, busqueda]);

  const totalRegistros = correosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / filasPorPagina));
  const correosPaginados = correosFiltrados.slice(
    (pagina - 1) * filasPorPagina,
    pagina * filasPorPagina
  );

  // Insertar helper en el Markdown
  const insertarEnMarkdown = (textoAIngresar: string) => {
    setPlantilla((prev) => ({
      ...prev,
      contenidoMarkdown: prev.contenidoMarkdown + " " + textoAIngresar,
    }));
  };

  // Guardar plantilla
  const guardarPlantilla = async () => {
    await ServicioCorreosRed.guardarPlantilla(plantilla);
    setAsuntoPrueba(plantilla.asunto);
    toast.success("Plantilla guardada", {
      description: "El formato de correo y página web ha sido actualizado.",
    });
  };

  // Enviar correo de prueba
  const ejecutarEnvioPrueba = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailPrueba || !emailPrueba.includes("@")) {
      toast.danger("Correo inválido", {
        description: "Por favor ingresa una dirección de correo válida para la prueba.",
      });
      return;
    }

    setEnviandoPrueba(true);

    try {
      await ServicioCorreosRed.enviarCorreoPrueba(emailPrueba, asuntoPrueba);
      const actualizados = await ServicioCorreosRed.obtenerCorreosEnviados();
      setCorreos([...actualizados]);

      toast.success("Correo de prueba enviado", {
        description: `Se envió la plantilla oficial a ${emailPrueba}.`,
      });

      setTabActiva("historial");
    } catch {
      toast.danger("Error en el envío", {
        description: "No se pudo despachar el correo de prueba.",
      });
    } finally {
      setEnviandoPrueba(false);
    }
  };

  // HTML generado para el correo
  const htmlCuerpoGenerado = useMemo(() => {
    return parsearMarkdownAHtml(plantilla.contenidoMarkdown);
  }, [plantilla.contenidoMarkdown]);

  return (
    <div className="flex flex-col gap-6 w-full relative">
      <Toast.Provider placement="top" />

      {/* Tabs HeroUI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs
          className="w-full sm:w-auto"
          selectedKey={tabActiva}
          onSelectionChange={(key) => setTabActiva(key as string)}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Módulos de Correo">
              <Tabs.Tab
                id="historial"
                className="flex items-center gap-2 px-4 py-2 whitespace-nowrap cursor-pointer"
              >
                <LetterIcon size={16} strokeWidth={1.8} className="shrink-0" />
                <span>Historial</span>
                <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-[#0064c1]/10 text-[#0064c1] font-bold font-mono">
                  {correos.length}
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>

              <Tabs.Tab
                id="plantilla"
                className="flex items-center gap-2 px-4 py-2 whitespace-nowrap cursor-pointer"
              >
                <Pen2Icon size={16} strokeWidth={1.8} className="shrink-0" />
                <span>Plantilla</span>
                <Tabs.Indicator />
              </Tabs.Tab>

              <Tabs.Tab
                id="prueba"
                className="flex items-center gap-2 px-4 py-2 whitespace-nowrap cursor-pointer"
              >
                <SendSquareIcon size={16} strokeWidth={1.8} className="shrink-0" />
                <span>Correo de prueba</span>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        {tabActiva !== "prueba" && (
          <button
            type="button"
            onClick={() => setTabActiva("prueba")}
            className="group/btn relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm self-start sm:self-auto shrink-0"
            style={{
              backgroundImage:
                "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
              boxShadow:
                "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
            }}
          >
            <SendSquareIcon size={16} strokeWidth={2} className="relative z-10" />
            <span className="relative z-10">Enviar correo de prueba</span>
          </button>
        )}
      </div>

      {/* PANEL 1: Historial de Envíos */}
      {tabActiva === "historial" && (
        <div className="flex flex-col gap-5 animate-rise">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/80 shadow-[0_4px_16px_-4px_rgba(9,60,120,0.1)] w-full sm:w-80">
              <RoundedMagnifierZoomInIcon size={16} className="text-[#787774] shrink-0" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por destinatario o correo..."
                className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="text-[#787774] hover:text-[#0a0a0a] cursor-pointer"
                >
                  <CloseCircleIcon size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#787774] font-medium">Entregados con éxito:</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-mono">
                {correos.filter((c) => c.estado === "Abierto" || c.estado === "Entregado").length}
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-[28px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md">
            <Table>
              <Table.ScrollContainer className="custom-scrollbar">
                <Table.Content
                  aria-label="Tabla de correos enviados de la Red de Aprendizaje"
                  className="w-full text-left"
                >
                  <Table.Header>
                    <Table.Column className="py-4 px-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                      Destinatario / Aspirante
                    </Table.Column>
                    <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                      Asunto
                    </Table.Column>
                    <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                      Fecha y Hora
                    </Table.Column>
                    <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-center">
                      Estado
                    </Table.Column>
                    <Table.Column className="py-4 px-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-right">
                      Plantilla
                    </Table.Column>
                  </Table.Header>

                  <Table.Body>
                    {correosPaginados.length === 0 ? (
                      <Table.Row id="empty-mail">
                        <Table.Cell className="py-16 text-center" colSpan={5}>
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black/[0.04] text-[#787774]">
                              <LetterIcon size={24} strokeWidth={1.5} />
                            </div>
                            <span className="text-sm font-bold text-[#0a0a0a]">No hay registros de correo</span>
                            <p className="text-xs text-[#787774] m-0">No se encontraron envíos que coincidan con la búsqueda.</p>
                          </div>
                        </Table.Cell>
                        <Table.Cell className="hidden">{null}</Table.Cell>
                        <Table.Cell className="hidden">{null}</Table.Cell>
                        <Table.Cell className="hidden">{null}</Table.Cell>
                        <Table.Cell className="hidden">{null}</Table.Cell>
                      </Table.Row>
                    ) : (
                      correosPaginados.map((correo) => (
                        <Table.Row key={correo.id} id={correo.id} className="transition-colors hover:bg-black/[0.02] group/row">
                          <Table.Cell className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div
                                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white text-xs font-bold shadow-xs"
                                style={{
                                  backgroundImage:
                                    "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                                }}
                              >
                                {correo.destinatarioNombre.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-bold text-[#0a0a0a] group-hover/row:text-[#0064c1] transition-colors truncate">
                                  {correo.destinatarioNombre}
                                </span>
                                <span className="text-[0.72rem] text-[#787774] font-mono truncate">
                                  {correo.destinatarioEmail}
                                </span>
                              </div>
                            </div>
                          </Table.Cell>

                          <Table.Cell className="py-4 px-4">
                            <span className="font-semibold text-xs text-[#0a0a0a] line-clamp-1">
                              {correo.asunto}
                            </span>
                          </Table.Cell>

                          <Table.Cell className="py-4 px-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-medium text-[#0a0a0a]">
                                {correo.fechaEnvio}
                              </span>
                              <span className="text-[0.7rem] text-[#787774] font-mono">
                                {correo.horaEnvio}
                              </span>
                            </div>
                          </Table.Cell>

                          <Table.Cell className="py-4 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[0.7rem] font-bold px-2.5 py-1 rounded-full ${
                                correo.estado === "Abierto"
                                  ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                                  : correo.estado === "Entregado"
                                  ? "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                                  : "bg-sky-500/10 text-sky-700 border border-sky-500/20"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  correo.estado === "Abierto"
                                    ? "bg-emerald-500"
                                    : correo.estado === "Entregado"
                                    ? "bg-blue-500"
                                    : "bg-sky-500"
                                }`}
                              />
                              {correo.estado}
                            </span>
                          </Table.Cell>

                          <Table.Cell className="py-4 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => setTabActiva("plantilla")}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0064c1] hover:bg-[#0064c1]/10 transition-colors cursor-pointer"
                            >
                              <EyeIcon size={14} strokeWidth={2} />
                              <span>Ver plantilla</span>
                            </button>
                          </Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-black/[0.06] bg-black/[0.01]">
              <span className="text-xs font-semibold text-[#787774] font-mono">
                Total de envíos: {totalRegistros}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagina === 1}
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pagina === 1
                      ? "text-black/30 bg-transparent cursor-not-allowed"
                      : "text-[#0a0a0a] bg-white border border-black/10 hover:bg-[#0064c1] hover:text-white shadow-xs cursor-pointer"
                  }`}
                >
                  <AltArrowLeftIcon size={12} strokeWidth={2.2} />
                  Prev
                </button>

                {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPagina(p)}
                    className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold transition-all ${
                      p === pagina
                        ? "bg-[#0064c1] text-white shadow-xs"
                        : "text-[#787774] hover:bg-black/[0.05] cursor-pointer"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    pagina === totalPaginas
                      ? "text-black/30 bg-transparent cursor-not-allowed"
                      : "text-[#0a0a0a] bg-white border border-black/10 hover:bg-[#0064c1] hover:text-white shadow-xs cursor-pointer"
                  }`}
                >
                  Next
                  <AltArrowRightIcon size={12} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: Editor de Plantilla Markdown y Previsualización en Vivo */}
      {tabActiva === "plantilla" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-rise">
          {/* Columna Izquierda: Editor Markdown */}
          <div className="lg:col-span-6 flex flex-col gap-5 p-6 rounded-[28px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14)] backdrop-blur-md">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#0064c1]/10 text-[#0064c1]">
                  <Pen2Icon size={16} strokeWidth={2} />
                </span>
                <div className="flex flex-col">
                  <h3 className="m-0 text-sm font-bold text-[#0a0a0a]">
                    Editor de Plantilla (Markdown)
                  </h3>
                  <span className="text-[0.7rem] text-[#787774]">
                    Edita el texto usando formato simple y variables
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={guardarPlantilla}
                className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-[#0064c1] hover:bg-[#0f2fe8] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                Guardar cambios
              </button>
            </div>

            {/* Asunto */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
              Asunto del correo:
              <input
                type="text"
                value={plantilla.asunto}
                onChange={(e) =>
                  setPlantilla({ ...plantilla, asunto: e.target.value })
                }
                className="px-3.5 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
              />
            </label>

            {/* Títulos del Header */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                Título superior:
                <input
                  type="text"
                  value={plantilla.encabezadoTitulo}
                  onChange={(e) =>
                    setPlantilla({ ...plantilla, encabezadoTitulo: e.target.value })
                  }
                  className="px-3.5 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                Subtítulo superior:
                <input
                  type="text"
                  value={plantilla.encabezadoSubtitulo}
                  onChange={(e) =>
                    setPlantilla({
                      ...plantilla,
                      encabezadoSubtitulo: e.target.value,
                    })
                  }
                  className="px-3.5 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                />
              </label>
            </div>

            {/* Barra de Herramientas Markdown y Variables */}
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0a0a0a]">
                  Cuerpo del Mensaje (Markdown)
                </span>
                <span className="text-[0.68rem] text-[#787774]">
                  Usa **negrita**, - listas, ### subtítulos
                </span>
              </div>

              {/* Botones de atajo Markdown */}
              <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-black/[0.03] border border-black/[0.05]">
                <button
                  type="button"
                  onClick={() => insertarEnMarkdown("**texto en negrita**")}
                  className="px-2 py-1 rounded-lg bg-white border border-black/10 text-xs font-bold text-[#0a0a0a] hover:bg-black/[0.05] cursor-pointer"
                  title="Negrita"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertarEnMarkdown("*texto en cursiva*")}
                  className="px-2.5 py-1 rounded-lg bg-white border border-black/10 text-xs italic font-serif text-[#0a0a0a] hover:bg-black/[0.05] cursor-pointer"
                  title="Cursiva"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertarEnMarkdown("### Subtítulo")}
                  className="px-2 py-1 rounded-lg bg-white border border-black/10 text-xs font-bold text-[#0a0a0a] hover:bg-black/[0.05] cursor-pointer"
                  title="Subtítulo H3"
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => insertarEnMarkdown("\n- Elemento de lista")}
                  className="px-2 py-1 rounded-lg bg-white border border-black/10 text-xs text-[#0a0a0a] hover:bg-black/[0.05] cursor-pointer"
                  title="Lista"
                >
                  • Lista
                </button>

                <div className="h-4 w-px bg-black/10 mx-1" />

                {/* Chips de variables */}
                {plantilla.variables.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertarEnMarkdown(v)}
                    className="px-2 py-0.5 rounded-md bg-[#0064c1]/10 hover:bg-[#0064c1]/20 text-[#0064c1] font-mono text-[0.68rem] font-bold transition-colors cursor-pointer"
                  >
                    + {v}
                  </button>
                ))}
              </div>

              {/* Textarea Markdown */}
              <textarea
                rows={9}
                value={plantilla.contenidoMarkdown}
                onChange={(e) =>
                  setPlantilla({ ...plantilla, contenidoMarkdown: e.target.value })
                }
                className="w-full p-4 rounded-2xl border border-black/10 bg-black/[0.02] text-xs font-mono text-[#0a0a0a] outline-none focus:border-[#0064c1] resize-y leading-relaxed"
                placeholder="Escribe el contenido en markdown..."
              />
            </div>

            {/* Configuración del Botón Principal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-black/[0.06]">
              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                Texto del botón CTA:
                <input
                  type="text"
                  value={plantilla.textoBotonCta}
                  onChange={(e) =>
                    setPlantilla({ ...plantilla, textoBotonCta: e.target.value })
                  }
                  className="px-3.5 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                Enlace del botón CTA:
                <input
                  type="text"
                  value={plantilla.enlaceBotonCta}
                  onChange={(e) =>
                    setPlantilla({ ...plantilla, enlaceBotonCta: e.target.value })
                  }
                  className="px-3.5 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-mono text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                />
              </label>
            </div>
          </div>

          {/* Columna Derecha: Previsualización en Tiempo Real */}
          <div className="lg:col-span-6 flex flex-col gap-4 sticky top-6">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                  Previsualización en Vivo
                </span>
                <span className="text-[0.65rem] font-bold text-[#0064c1] bg-[#0064c1]/10 px-2 py-0.5 rounded-full">
                  En Vivo
                </span>
              </div>

              {/* Selector de vista: Correo vs Web */}
              <div className="inline-flex p-0.5 rounded-xl bg-black/[0.04] border border-black/[0.04]">
                <button
                  type="button"
                  onClick={() => setVistaTemplate("correo")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    vistaTemplate === "correo"
                      ? "bg-white text-[#0064c1] shadow-xs"
                      : "text-[#787774] hover:text-[#0a0a0a]"
                  }`}
                >
                  Template Correo
                </button>
                <button
                  type="button"
                  onClick={() => setVistaTemplate("web")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    vistaTemplate === "web"
                      ? "bg-white text-[#0064c1] shadow-xs"
                      : "text-[#787774] hover:text-[#0a0a0a]"
                  }`}
                >
                  Template Web
                </button>
              </div>
            </div>

            {/* Tarjeta de Previsualización */}
            <div className="p-4 sm:p-6 rounded-[28px] bg-white border border-black/10 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1)] overflow-hidden">
              {vistaTemplate === "correo" ? (
                /* Previsualización Email */
                <div className="max-w-md mx-auto rounded-2xl border border-black/10 overflow-hidden bg-white shadow-xs font-sans">
                  {/* Header Azul Oficial */}
                  <div
                    className="p-6 text-center text-white"
                    style={{
                      backgroundImage:
                        "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#0064c1, #0f2fe8)",
                    }}
                  >
                    <span className="inline-block text-[0.62rem] font-bold uppercase tracking-[0.18em] bg-white/20 px-2.5 py-0.5 rounded-full mb-2">
                      Red de Aprendizaje
                    </span>
                    <h3 className="m-0 text-lg font-bold leading-tight">
                      {plantilla.encabezadoTitulo}
                    </h3>
                    <p className="m-0 text-xs opacity-90 mt-1">
                      {plantilla.encabezadoSubtitulo}
                    </p>
                  </div>

                  {/* Cuerpo parseado de Markdown */}
                  <div className="p-6 text-[#1f2937]">
                    <div
                      className="text-xs leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: htmlCuerpoGenerado }}
                    />

                    {/* Botón CTA */}
                    {plantilla.textoBotonCta && (
                      <div className="text-center my-6">
                        <div
                          className="inline-block px-6 py-2.5 rounded-full text-white text-xs font-bold shadow-md"
                          style={{
                            backgroundImage:
                              "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #0064c1)",
                          }}
                        >
                          {plantilla.textoBotonCta}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 bg-zinc-50 border-t border-black/5 text-center text-[0.68rem] text-[#787774]">
                    {plantilla.mensajePie}
                  </div>
                </div>
              ) : (
                /* Previsualización Web Landing */
                <div className="flex flex-col items-center justify-center text-center p-8 bg-gradient-to-b from-blue-50/50 to-white rounded-2xl border border-blue-100">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 grid place-items-center mb-4 shadow-xs">
                    <CheckCircleIcon size={24} strokeWidth={2} />
                  </div>
                  <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[#0064c1] mb-1">
                    Confirmación Oficial
                  </span>
                  <h3 className="text-lg font-extrabold text-[#0a0a0a] tracking-tight mb-2">
                    {plantilla.encabezadoTitulo}
                  </h3>
                  <p className="max-w-xs text-xs text-[#787774] leading-relaxed mb-5">
                    Tu postulación ha sido verificada. Accede al repositorio institucional y módulos activos.
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="px-4 py-2 rounded-full text-xs font-bold text-white bg-[#0064c1] shadow-xs">
                      Ir al Dashboard
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PANEL 3: Enviar Correo de Prueba */}
      {tabActiva === "prueba" && (
        <form
          onSubmit={ejecutarEnvioPrueba}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-rise max-w-3xl mx-auto w-full"
        >
          <div className="lg:col-span-12 flex flex-col gap-6 p-6 md:p-8 rounded-[32px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14)] backdrop-blur-md">
            <div className="flex items-center gap-3 pb-3 border-b border-black/[0.06]">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#0064c1]/10 text-[#0064c1]">
                <SendSquareIcon size={20} strokeWidth={2} />
              </span>
              <div className="flex flex-col">
                <h3 className="m-0 text-base font-bold text-[#0a0a0a]">
                  Enviar Correo de Prueba
                </h3>
                <span className="text-xs text-[#787774]">
                  Se despachará la plantilla oficial configurada en Markdown
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
                Correo destinatario de prueba:
                <input
                  type="email"
                  value={emailPrueba}
                  onChange={(e) => setEmailPrueba(e.target.value)}
                  placeholder="ejemplo@universidad.edu.co"
                  className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] font-mono"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
                Asunto del correo:
                <input
                  type="text"
                  value={asuntoPrueba}
                  onChange={(e) => setAsuntoPrueba(e.target.value)}
                  className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                  required
                />
              </label>

              {/* Resumen de la plantilla */}
              <div className="p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06] flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-[#0a0a0a]">
                    {plantilla.nombre}
                  </span>
                  <span className="text-[0.7rem] text-[#787774]">
                    Contenido editable en la pestaña "Plantilla"
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setTabActiva("plantilla")}
                  className="text-xs font-bold text-[#0a0a0a] hover:text-[#0064c1] font-semibold transition-colors cursor-pointer"
                >
                  Editar plantilla →
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setTabActiva("historial")}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={enviandoPrueba}
                className="group/btn relative inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm"
                style={{
                  backgroundImage:
                    "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                  boxShadow:
                    "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
                }}
              >
                {enviandoPrueba ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Despachando correo...</span>
                  </>
                ) : (
                  <>
                    <SendSquareIcon size={16} strokeWidth={2} className="relative z-10" />
                    <span className="relative z-10">Enviar correo de prueba ahora</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
export default GestionCorreosRed;
