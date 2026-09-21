"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Tabs, Table, Toast, toast } from "@heroui/react";
import {
  LetterIcon,
  CheckCircleIcon,
  CloseCircleIcon,
  RoundedMagnifierZoomInIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  EyeIcon,
  SendSquareIcon,
  Pen2Icon,
  UserIcon,
} from "@solar-icons/react/outline";
import type { CorreoEnviado, PlantillaRed } from "../services/correos.types";
import { ServicioCorreosRed } from "../services/correos.service";

interface Props {
  correosIniciales: CorreoEnviado[];
  plantillaInicial: PlantillaRed;
}

export const GestionCorreosRed: React.FC<Props> = ({
  correosIniciales,
  plantillaInicial,
}) => {
  const [montado, setMontado] = useState(false);
  const [tabActiva, setTabActiva] = useState<string>("historial");
  const [correos, setCorreos] = useState<CorreoEnviado[]>(correosIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const filasPorPagina = 8;

  // Estado para el modal de visualización de correo enviado
  const [correoSeleccionado, setCorreoSeleccionado] = useState<CorreoEnviado | null>(null);

  // Plantilla oficial
  const [plantilla, setPlantilla] = useState<PlantillaRed>(plantillaInicial);

  // Formulario de Envío de Prueba
  const [emailPrueba, setEmailPrueba] = useState("usuario.prueba@observatorio.edu.co");
  const [asuntoPrueba, setAsuntoPrueba] = useState(plantillaInicial.asunto);
  const [enviandoPrueba, setEnviandoPrueba] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

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

  const inicioRango = totalRegistros === 0 ? 0 : (pagina - 1) * filasPorPagina + 1;
  const finRango = Math.min(pagina * filasPorPagina, totalRegistros);

  // Guardar plantilla
  const guardarPlantilla = async () => {
    await ServicioCorreosRed.guardarPlantilla(plantilla);
    setAsuntoPrueba(plantilla.asunto);
    toast.success("Plantilla guardada", {
      description: "El formato de correo institucional ha sido actualizado.",
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
      const res = await ServicioCorreosRed.enviarCorreoPrueba(emailPrueba, asuntoPrueba);
      if (res.exito) {
        const actualizados = await ServicioCorreosRed.obtenerCorreosEnviados();
        setCorreos([...actualizados]);
        toast.success("Correo enviado", { description: res.mensaje });
        setTabActiva("historial");
      } else {
        toast.danger("Error al enviar", { description: res.mensaje });
      }
    } catch {
      toast.danger("Error en el envío", {
        description: "No se pudo despachar el correo de prueba.",
      });
    } finally {
      setEnviandoPrueba(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full relative">
      <Toast.Provider placement="top" />

      {/* Selector de Pestañas con estilo cápsula limpia */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="inline-flex p-1 rounded-full bg-black/[0.04]">
          {[
            { id: "historial", label: "Historial de envíos", count: correos.length },
            { id: "prueba", label: "Enviar prueba" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setTabActiva(tab.id);
                setPagina(1);
              }}
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                tabActiva === tab.id
                  ? "bg-white text-[#0a0a0a] shadow-xs"
                  : "text-[#787774] hover:text-[#0a0a0a]"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && (
                <span
                  className={`text-[0.68rem] px-1.5 py-0.2 rounded-full font-mono font-medium ${
                    tabActiva === tab.id
                      ? "bg-black/[0.06] text-[#0a0a0a]"
                      : "bg-black/[0.03] text-[#787774]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {tabActiva !== "prueba" && (
          <button
            type="button"
            onClick={() => setTabActiva("prueba")}
            className="group/btn relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm self-start md:self-auto shrink-0"
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
          {/* Buscador y Resumen */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/80 shadow-[0_4px_16px_-4px_rgba(9,60,120,0.1)] w-full sm:w-80">
              <RoundedMagnifierZoomInIcon size={16} className="text-[#787774] shrink-0" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  setPagina(1);
                }}
                placeholder="Buscar por destinatario, correo o asunto..."
                className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  className="text-[#787774] hover:text-[#0a0a0a] cursor-pointer"
                >
                  <CloseCircleIcon size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#787774]">Correos despachados:</span>
              <span className="font-mono text-xs font-bold text-[#0064c1] bg-[#0064c1]/10 px-3 py-1 rounded-full">
                {correos.length}
              </span>
            </div>
          </div>

          {/* Tabla de Correos Enviados */}
          <div className="overflow-hidden rounded-[28px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md">
            {correosProcesadosLength(correosFiltrados) === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black/[0.04] text-[#787774]">
                  <LetterIcon size={24} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-[#0a0a0a]">No hay registros de correo</span>
                  <p className="text-xs text-[#787774] m-0 max-w-sm">
                    {busqueda
                      ? "No se encontraron envíos que coincidan con los términos de búsqueda."
                      : "Aún no se han despachado correos a los aspirantes."}
                  </p>
                </div>
              </div>
            ) : (
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
                        Detalle
                      </Table.Column>
                    </Table.Header>

                    <Table.Body>
                      {correosPaginados.map((correo) => (
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
                                  : correo.estado === "Entregado" || correo.estado === "Enviado"
                                  ? "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                                  : "bg-red-500/10 text-red-700 border border-red-500/20"
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  correo.estado === "Abierto"
                                    ? "bg-emerald-500"
                                    : correo.estado === "Entregado" || correo.estado === "Enviado"
                                    ? "bg-blue-500"
                                    : "bg-red-500"
                                }`}
                              />
                              {correo.estado}
                            </span>
                          </Table.Cell>

                          <Table.Cell className="py-4 px-5 text-right">
                            <button
                              type="button"
                              onClick={() => setCorreoSeleccionado(correo)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#0064c1] bg-[#0064c1]/10 hover:bg-[#0064c1] hover:text-white transition-all cursor-pointer active:scale-95 shadow-2xs"
                            >
                              <EyeIcon size={14} strokeWidth={2} />
                              <span>Ver correo</span>
                            </button>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            )}

            {/* Paginación */}
            {correosFiltrados.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-black/[0.06] bg-black/[0.01]">
                <span className="text-xs font-semibold text-[#787774] font-mono">
                  {inicioRango} to {finRango} of {totalRegistros} results
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pagina === 1}
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      pagina === 1
                        ? "text-black/30 bg-transparent cursor-not-allowed"
                        : "text-[#0a0a0a] bg-white border border-black/10 hover:bg-[#0064c1] hover:text-white shadow-xs cursor-pointer active:scale-95"
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
                        : "text-[#0a0a0a] bg-white border border-black/10 hover:bg-[#0064c1] hover:text-white shadow-xs cursor-pointer active:scale-95"
                    }`}
                  >
                    Next
                    <AltArrowRightIcon size={12} strokeWidth={2.2} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PANEL 3: Enviar Correo de Prueba */}
      {tabActiva === "prueba" && (
        <form
          onSubmit={ejecutarEnvioPrueba}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-rise max-w-2xl mx-auto w-full"
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
                  Despacha la plantilla oficial a cualquier dirección de prueba
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
                Correo destinatario:
                <input
                  type="email"
                  value={emailPrueba}
                  onChange={(e) => setEmailPrueba(e.target.value)}
                  placeholder="ejemplo@observatorio.edu.co"
                  className="px-4 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] font-mono"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
                Asunto del correo:
                <input
                  type="text"
                  value={asuntoPrueba}
                  onChange={(e) => setAsuntoPrueba(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                  required
                />
              </label>
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
                className="group/btn relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm"
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
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <SendSquareIcon size={16} strokeWidth={2} className="relative z-10" />
                    <span className="relative z-10">Despachar prueba</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* MODAL: Visualización de Correo Enviado */}
      {montado &&
        correoSeleccionado &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 animate-fade-in">
            <div className="flex flex-col gap-4 max-w-2xl w-full p-6 rounded-[28px] bg-white shadow-2xl max-h-[90vh] overflow-hidden animate-rise">
              {/* Header del Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white text-xs font-bold shadow-xs"
                    style={{
                      backgroundImage:
                        "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                    }}
                  >
                    {correoSeleccionado.destinatarioNombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="m-0 text-base font-bold text-[#0a0a0a]">
                      {correoSeleccionado.destinatarioNombre}
                    </h3>
                    <span className="text-xs text-[#787774] font-mono">
                      {correoSeleccionado.destinatarioEmail} · {correoSeleccionado.fechaEnvio} ({correoSeleccionado.horaEnvio})
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCorreoSeleccionado(null)}
                  className="text-[#787774] hover:text-[#0a0a0a] cursor-pointer p-1"
                >
                  <CloseCircleIcon size={20} />
                </button>
              </div>

              {/* Asunto */}
              <div className="p-3 rounded-xl bg-black/[0.02] border border-black/[0.05] flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0a0a0a] truncate">
                  Asunto: {correoSeleccionado.asunto}
                </span>
                <span className="text-[0.68rem] font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full shrink-0">
                  {correoSeleccionado.estado}
                </span>
              </div>

              {/* Contenedor del contenido HTML del Correo */}
              <div className="flex-1 overflow-y-auto custom-scrollbar border border-black/[0.08] rounded-2xl p-4 bg-[#fbfbfa]">
                {correoSeleccionado.contenidoHtml ? (
                  <div
                    className="bg-white rounded-xl shadow-xs overflow-hidden max-w-[540px] mx-auto"
                    dangerouslySetInnerHTML={{ __html: correoSeleccionado.contenidoHtml }}
                  />
                ) : (
                  <div className="max-w-[480px] mx-auto rounded-xl bg-white p-6 shadow-xs border border-black/[0.06] text-xs text-[#222222] leading-relaxed flex flex-col gap-3">
                    <div className="text-center pb-3 border-b border-black/[0.06]">
                      <img
                        src="https://cdn.phototourl.com/free/2026-09-17-2fa4f239-5e78-4849-8777-4768e6560c67.png"
                        alt="Logo"
                        className="h-10 mx-auto object-contain mb-2"
                      />
                      <h4 className="m-0 text-sm font-bold text-[#0a0a0a]">Notificación de Admisión</h4>
                      <p className="m-0 text-[0.7rem] text-[#787774]">Observatorio de Responsabilidad Social</p>
                    </div>
                    <p className="m-0">
                      Estimado(a) <strong>{correoSeleccionado.destinatarioNombre}</strong>,
                    </p>
                    <p className="m-0">
                      Tu postulación a la Red de Aprendizaje ha sido aprobada formalmente.
                    </p>
                    <div className="p-3 rounded-lg bg-black/[0.03] border border-black/[0.05] text-[0.72rem] font-mono">
                      <div>Usuario: {correoSeleccionado.destinatarioEmail}</div>
                      <div className="text-[#787774]">Contraseña: Número de cédula</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setCorreoSeleccionado(null)}
                  className="px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#0064c1] hover:bg-[#0f2fe8] active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

function correosProcesadosLength(lista: CorreoEnviado[]): number {
  return lista.length;
}

export default GestionCorreosRed;
