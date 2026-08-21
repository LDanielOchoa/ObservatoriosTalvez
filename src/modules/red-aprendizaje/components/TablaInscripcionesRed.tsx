"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Selection } from "@heroui/react";
import { Checkbox, Table, Calendar, Toast, toast } from "@heroui/react";
import {
  CheckCircleIcon,
  CloseCircleIcon,
  RoundedMagnifierZoomInIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  UsersGroupRoundedIcon,
  DangerTriangleIcon,
  CalendarIcon,
} from "@solar-icons/react/outline";
import type { SolicitudInscripcionRed } from "../services/inscripciones.types";

interface Props {
  solicitudes: SolicitudInscripcionRed[];
}

type CampoOrden = "nombre" | "cedula" | "carrera" | "universidad" | "fechaSolicitud" | "estado";
type DireccionOrden = "asc" | "desc";
type FiltroEstado = "Todos" | "Pendiente" | "Aprobado" | "Rechazado";

const FILAS_POR_PAGINA = 10;

export const TablaInscripcionesRed: React.FC<Props> = ({ solicitudes: solicitudesIniciales }) => {
  const [lista, setLista] = useState<SolicitudInscripcionRed[]>(solicitudesIniciales);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todos");
  const [pagina, setPagina] = useState(1);
  const [columnaOrden, setColumnaOrden] = useState<CampoOrden>("fechaSolicitud");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("desc");
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  // Modal de Cierre de Postulaciones
  const [modalPostulacionesAbierto, setModalPostulacionesAbierto] = useState(false);
  const [mensajeCierre, setMensajeCierre] = useState(
    "El periodo de inscripciones para la Red de Aprendizaje ha finalizado. Las nuevas postulaciones se abrirán en el próximo periodo académico."
  );
  const [postulacionesActivas, setPostulacionesActivas] = useState(true);

  // Popover de confirmación unitario
  const [solicitudAProcesar, setSolicitudAProcesar] = useState<{
    id: string;
    nombre: string;
    accion: "Aprobado" | "Rechazado";
  } | null>(null);

  // Modal de confirmación masiva
  const [modalMasivo, setModalMasivo] = useState<"Aprobado" | "Rechazado" | null>(null);

  // Alternar ordenamiento por columna
  const manejarOrden = (campo: CampoOrden) => {
    if (columnaOrden === campo) {
      setDireccionOrden(direccionOrden === "asc" ? "desc" : "asc");
    } else {
      setColumnaOrden(campo);
      setDireccionOrden("asc");
    }
  };

  // Filtrado y Ordenamiento
  const solicitudesProcesadas = useMemo(() => {
    let resultado = lista.filter((sol) => {
      if (filtroEstado !== "Todos" && sol.estado !== filtroEstado) {
        return false;
      }
      const termino = busqueda.toLowerCase().trim();
      if (!termino) return true;
      return (
        sol.nombre.toLowerCase().includes(termino) ||
        sol.cedula.includes(termino) ||
        sol.carrera.toLowerCase().includes(termino) ||
        sol.universidad.toLowerCase().includes(termino) ||
        sol.telefono.includes(termino)
      );
    });

    resultado.sort((a, b) => {
      const valorA = a[columnaOrden] || "";
      const valorB = b[columnaOrden] || "";
      const comparacion = valorA.localeCompare(valorB, "es", { numeric: true });
      return direccionOrden === "asc" ? comparacion : -comparacion;
    });

    return resultado;
  }, [lista, busqueda, filtroEstado, columnaOrden, direccionOrden]);

  // Paginación
  const totalRegistros = solicitudesProcesadas.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / FILAS_POR_PAGINA));

  const solicitudesPaginadas = useMemo(() => {
    const inicio = (pagina - 1) * FILAS_POR_PAGINA;
    return solicitudesProcesadas.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [solicitudesProcesadas, pagina]);

  const inicioRango = totalRegistros === 0 ? 0 : (pagina - 1) * FILAS_POR_PAGINA + 1;
  const finRango = Math.min(pagina * FILAS_POR_PAGINA, totalRegistros);

  // Obtener IDs seleccionados
  const idsSeleccionados = useMemo(() => {
    if (selectedKeys === "all") {
      return solicitudesProcesadas.map((s) => s.id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, solicitudesProcesadas]);

  const totalSeleccionados = idsSeleccionados.length;

  // Acciones Unitarias
  const ejecutarAccionUnitaria = (id: string, nuevoEstado: "Aprobado" | "Rechazado", nombre: string) => {
    setLista((prev) =>
      prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
    );
    setSolicitudAProcesar(null);
    if (nuevoEstado === "Aprobado") {
      toast.success("Solicitud aprobada", {
        description: `Se aceptó formalmente a "${nombre}" en la Red de Aprendizaje.`,
      });
    } else {
      toast.danger("Solicitud rechazada", {
        description: `Se rechazó la solicitud de "${nombre}".`,
      });
    }
  };

  // Acciones Masivas
  const ejecutarAccionMasiva = (nuevoEstado: "Aprobado" | "Rechazado") => {
    if (idsSeleccionados.length === 0) return;
    const totalAfectados = idsSeleccionados.length;
    setLista((prev) =>
      prev.map((s) => (idsSeleccionados.includes(s.id) ? { ...s, estado: nuevoEstado } : s))
    );
    setSelectedKeys(new Set());
    setModalMasivo(null);

    if (nuevoEstado === "Aprobado") {
      toast.success("Inscripciones aprobadas", {
        description: `Se aceptaron ${totalAfectados} solicitudes seleccionadas exitosamente.`,
      });
    } else {
      toast.danger("Inscripciones rechazadas", {
        description: `Se rechazaron ${totalAfectados} solicitudes seleccionadas.`,
      });
    }
  };

  // Guardar configuración de cierre de postulaciones
  const guardarAjustesPostulacion = () => {
    setModalPostulacionesAbierto(false);
    toast.success("Configuración actualizada", {
      description: postulacionesActivas
        ? "El formulario público se encuentra activo con la fecha límite establecida."
        : "Se han cerrado las postulaciones públicas en el formulario.",
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full relative">
      <Toast.Provider placement="top" />

      {/* Barra de Filtros, Búsqueda y Botón de Convocatoria */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador */}
          <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full border border-white/80 shadow-[0_4px_16px_-4px_rgba(9,60,120,0.1)] w-full sm:w-72">
            <RoundedMagnifierZoomInIcon size={16} className="text-[#787774] shrink-0" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nombre, cédula, universidad..."
              className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
            />
            {busqueda && (
              <button
                onClick={() => {
                  setBusqueda("");
                  setPagina(1);
                }}
                className="text-[#787774] hover:text-[#0a0a0a] cursor-pointer"
              >
                <CloseCircleIcon size={14} />
              </button>
            )}
          </div>

          {/* Filtro por Estado */}
          <div className="inline-flex p-1 rounded-full bg-black/[0.04] border border-black/[0.04]">
            {(["Todos", "Pendiente", "Aprobado", "Rechazado"] as FiltroEstado[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setFiltroEstado(tab);
                  setPagina(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  filtroEstado === tab
                    ? "bg-white text-[#0a0a0a] shadow-xs"
                    : "text-[#787774] hover:text-[#0a0a0a]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Botón de Formulario público / Gestión de Cierre & Acciones Masivas */}
        <div className="flex items-center gap-3">
          {totalSeleccionados > 0 ? (
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-full bg-[#0064c1]/10 border border-[#0064c1]/20 animate-rise">
              <span className="text-xs font-bold text-[#0064c1] font-mono">
                {totalSeleccionados} seleccionados
              </span>
              <div className="h-3.5 w-px bg-[#0064c1]/30 mx-1" />
              <button
                type="button"
                onClick={() => setModalMasivo("Aprobado")}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <CheckCircleIcon size={14} strokeWidth={2} />
                Aprobar grupo
              </button>
              <button
                type="button"
                onClick={() => setModalMasivo("Rechazado")}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <CloseCircleIcon size={14} strokeWidth={2} />
                Rechazar grupo
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setModalPostulacionesAbierto(true)}
              className="group/btn relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm"
              style={{
                backgroundImage:
                  "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                boxShadow:
                  "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
              }}
            >
              <CalendarIcon size={16} strokeWidth={2} className="relative z-10" />
              <span className="relative z-10">Formulario público de red</span>
            </button>
          )}
        </div>
      </div>

      {/* Componente Table de @heroui/react con Checkbox y selectionMode */}
      <div className="overflow-hidden rounded-[28px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <Table>
          <Table.ScrollContainer className="custom-scrollbar">
            <Table.Content
              aria-label="Tabla de solicitudes de la Red de Aprendizaje"
              className="w-full text-left"
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              onSelectionChange={setSelectedKeys}
            >
              <Table.Header>
                {/* Columna Checkbox HeroUI */}
                <Table.Column className="py-4 px-4 w-10 pe-0">
                  <Checkbox aria-label="Seleccionar todos" slot="selection">
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </Table.Column>

                {/* Columna Aspirante */}
                <Table.Column
                  onClick={() => manejarOrden("nombre")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Aspirante</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "nombre" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Identificación & Contacto */}
                <Table.Column
                  onClick={() => manejarOrden("cedula")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Identificación &amp; Contacto</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "cedula" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Carrera & Semestre */}
                <Table.Column
                  onClick={() => manejarOrden("carrera")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Programa &amp; Semestre</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "carrera" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Universidad */}
                <Table.Column
                  onClick={() => manejarOrden("universidad")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Universidad</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "universidad" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Estado */}
                <Table.Column
                  onClick={() => manejarOrden("estado")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-center cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>Estado</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "estado" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Decisión */}
                <Table.Column className="py-4 px-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-right">
                  Decisión
                </Table.Column>
              </Table.Header>

              <Table.Body>
                {solicitudesPaginadas.length === 0 ? (
                  <Table.Row id="empty-row">
                    <Table.Cell className="py-16 text-center" colSpan={7}>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black/[0.04] text-[#787774]">
                          <UsersGroupRoundedIcon size={24} strokeWidth={1.5} />
                        </div>
                        <span className="text-sm font-bold text-[#0a0a0a]">No hay solicitudes</span>
                        <p className="text-xs text-[#787774] m-0">No se encontraron aspirantes que coincidan con los filtros aplicados.</p>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="hidden">{null}</Table.Cell>
                    <Table.Cell className="hidden">{null}</Table.Cell>
                    <Table.Cell className="hidden">{null}</Table.Cell>
                    <Table.Cell className="hidden">{null}</Table.Cell>
                    <Table.Cell className="hidden">{null}</Table.Cell>
                    <Table.Cell className="hidden">{null}</Table.Cell>
                  </Table.Row>
                ) : (
                  solicitudesPaginadas.map((sol) => (
                    <Table.Row key={sol.id} id={sol.id} className="transition-colors hover:bg-black/[0.02] group/row">
                      {/* Checkbox individual HeroUI */}
                      <Table.Cell className="py-4 px-4 pe-0">
                        <Checkbox
                          aria-label={`Seleccionar a ${sol.nombre}`}
                          slot="selection"
                          variant="secondary"
                        >
                          <Checkbox.Content>
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Content>
                        </Checkbox>
                      </Table.Cell>

                      {/* Aspirante */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white text-xs font-bold shadow-xs"
                            style={{
                              backgroundImage:
                                "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                              boxShadow:
                                "inset 0 1px 1px rgba(255,255,255,0.6), 0 2px 8px -2px rgba(58,138,244,0.4)",
                            }}
                          >
                            {sol.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0a0a0a] group-hover/row:text-[#0064c1] transition-colors">
                              {sol.nombre}
                            </span>
                            <span className="text-[0.7rem] text-[#787774]">
                              Solicitud: {sol.fechaSolicitud}
                            </span>
                          </div>
                        </div>
                      </Table.Cell>

                      {/* Identificación & Teléfono */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-semibold text-[#0a0a0a]">CC: {sol.cedula}</span>
                          <span className="text-[0.72rem] text-[#787774]">Tel: {sol.telefono}</span>
                        </div>
                      </Table.Cell>

                      {/* Carrera & Semestre */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[#0a0a0a]">{sol.carrera}</span>
                          <span className="text-[0.7rem] font-medium text-[#0064c1] bg-[#0064c1]/[0.08] px-2 py-0.5 rounded-md w-fit">
                            {sol.semestre}
                          </span>
                        </div>
                      </Table.Cell>

                      {/* Universidad */}
                      <Table.Cell className="py-4 px-4">
                        <span className="text-[#2f3437] font-medium">{sol.universidad}</span>
                      </Table.Cell>

                      {/* Estado */}
                      <Table.Cell className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[0.7rem] font-bold px-2.5 py-1 rounded-full ${
                            sol.estado === "Aprobado"
                              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                              : sol.estado === "Rechazado"
                              ? "bg-red-500/10 text-red-700 border border-red-500/20"
                              : "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              sol.estado === "Aprobado"
                                ? "bg-emerald-500"
                                : sol.estado === "Rechazado"
                                ? "bg-red-500"
                                : "bg-amber-500"
                            }`}
                          />
                          {sol.estado}
                        </span>
                      </Table.Cell>

                      {/* Decisión Unitaria */}
                      <Table.Cell className="py-4 px-5 text-right relative">
                        <div className="inline-flex items-center gap-1.5 relative">
                          {/* Botón Aceptar Solicitud */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setSolicitudAProcesar(
                                  solicitudAProcesar?.id === sol.id && solicitudAProcesar.accion === "Aprobado"
                                    ? null
                                    : { id: sol.id, nombre: sol.nombre, accion: "Aprobado" }
                                )
                              }
                              disabled={sol.estado === "Aprobado"}
                              className={`grid h-8 w-8 place-items-center rounded-lg transition-all cursor-pointer ${
                                sol.estado === "Aprobado"
                                  ? "text-emerald-300 opacity-40 cursor-not-allowed"
                                  : "text-emerald-600 hover:text-white hover:bg-emerald-600 bg-emerald-50 shadow-xs"
                              }`}
                              title="Aceptar solicitud"
                            >
                              <CheckCircleIcon size={18} strokeWidth={2} />
                            </button>

                            {/* Mini Popover de Aprobación */}
                            {solicitudAProcesar?.id === sol.id && solicitudAProcesar.accion === "Aprobado" && (
                              <div className="absolute right-0 top-10 z-50 flex flex-col gap-2.5 w-64 p-3.5 rounded-2xl bg-white border border-emerald-500/20 shadow-[0_16px_36px_-10px_rgba(16,185,129,0.3)] text-left animate-rise">
                                <div className="flex items-center gap-2">
                                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                                    <CheckCircleIcon size={16} strokeWidth={2} />
                                  </span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-[#0a0a0a] truncate leading-tight">
                                      ¿Aceptar aspirante?
                                    </span>
                                    <span className="text-[0.66rem] text-[#787774] truncate">
                                      {sol.nombre}
                                    </span>
                                  </div>
                                </div>
                                <p className="m-0 text-[0.72rem] text-[#2f3437] leading-tight">
                                  Se habilitará el acceso a la Red de Aprendizaje.
                                </p>
                                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-black/[0.06]">
                                  <button
                                    type="button"
                                    onClick={() => setSolicitudAProcesar(null)}
                                    className="px-2.5 py-1 rounded-lg text-[0.72rem] font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => ejecutarAccionUnitaria(sol.id, "Aprobado", sol.nombre)}
                                    className="px-3 py-1 rounded-lg text-[0.72rem] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                                  >
                                    Confirmar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Botón Rechazar Solicitud */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setSolicitudAProcesar(
                                  solicitudAProcesar?.id === sol.id && solicitudAProcesar.accion === "Rechazado"
                                    ? null
                                    : { id: sol.id, nombre: sol.nombre, accion: "Rechazado" }
                                )
                              }
                              disabled={sol.estado === "Rechazado"}
                              className={`grid h-8 w-8 place-items-center rounded-lg transition-all cursor-pointer ${
                                sol.estado === "Rechazado"
                                  ? "text-red-300 opacity-40 cursor-not-allowed"
                                  : "text-red-600 hover:text-white hover:bg-red-600 bg-red-50 shadow-xs"
                              }`}
                              title="Rechazar solicitud"
                            >
                              <CloseCircleIcon size={18} strokeWidth={2} />
                            </button>

                            {/* Mini Popover de Rechazo */}
                            {solicitudAProcesar?.id === sol.id && solicitudAProcesar.accion === "Rechazado" && (
                              <div className="absolute right-0 top-10 z-50 flex flex-col gap-2.5 w-64 p-3.5 rounded-2xl bg-white border border-red-500/20 shadow-[0_16px_36px_-10px_rgba(239,68,68,0.3)] text-left animate-rise">
                                <div className="flex items-center gap-2">
                                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-50 text-red-600 shrink-0">
                                    <DangerTriangleIcon size={16} strokeWidth={2} />
                                  </span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-[#0a0a0a] truncate leading-tight">
                                      ¿Negar aspirante?
                                    </span>
                                    <span className="text-[0.66rem] text-[#787774] truncate">
                                      {sol.nombre}
                                    </span>
                                  </div>
                                </div>
                                <p className="m-0 text-[0.72rem] text-[#2f3437] leading-tight">
                                  La solicitud quedará denegada en el sistema.
                                </p>
                                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-black/[0.06]">
                                  <button
                                    type="button"
                                    onClick={() => setSolicitudAProcesar(null)}
                                    className="px-2.5 py-1 rounded-lg text-[0.72rem] font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => ejecutarAccionUnitaria(sol.id, "Rechazado", sol.nombre)}
                                    className="px-3 py-1 rounded-lg text-[0.72rem] font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                                  >
                                    Negar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {/* Paginación y Estado de Selección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-black/[0.06] bg-black/[0.01]">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-[#787774] font-mono">
              {inicioRango} to {finRango} of {totalRegistros} results
            </span>
            <span className="text-xs text-[#787774]">
              Seleccionados:{" "}
              <span className="font-semibold text-[#0a0a0a]">
                {selectedKeys === "all" ? "Todos" : totalSeleccionados > 0 ? totalSeleccionados : "Ninguno"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              type="button"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                pagina === 1
                  ? "text-black/30 bg-transparent cursor-not-allowed"
                  : "text-[#0a0a0a] bg-white border border-black/10 hover:bg-[#0064c1] hover:text-white hover:border-[#0064c1] shadow-xs cursor-pointer active:scale-95"
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
                    : "text-[#787774] hover:bg-black/[0.05] hover:text-[#0a0a0a] cursor-pointer"
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
                  : "text-[#0a0a0a] bg-white border border-black/10 hover:bg-[#0064c1] hover:text-white hover:border-[#0064c1] shadow-xs cursor-pointer active:scale-95"
              }`}
            >
              Next
              <AltArrowRightIcon size={12} strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Convocatoria y Cierre de Postulaciones (Renderizado con Portal al body) */}
      {montado &&
        modalPostulacionesAbierto &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60">
            <div className="flex flex-col gap-5 max-w-xl w-full p-6 md:p-8 rounded-[28px] bg-white shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              {/* Header del Modal */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#0064c1]/10 text-[#0064c1]">
                    <CalendarIcon size={20} strokeWidth={2} />
                  </span>
                  <div className="flex flex-col">
                    <h3 className="m-0 text-base font-bold text-[#0a0a0a]">
                      Cierre de Postulaciones
                    </h3>
                    <span className="text-xs text-[#787774]">
                      Configura la fecha límite y el mensaje del formulario
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalPostulacionesAbierto(false)}
                  className="text-[#787774] hover:text-[#0a0a0a] cursor-pointer"
                >
                  <CloseCircleIcon size={20} />
                </button>
              </div>

              {/* Switch de Estado de Postulaciones */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-[#0a0a0a]">
                    Estado de Convocatoria
                  </span>
                  <span className="text-[0.72rem] text-[#787774]">
                    {postulacionesActivas
                      ? "El formulario está habilitado para recibir postulaciones"
                      : "El formulario se encuentra cerrado temporalmente"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setPostulacionesActivas(!postulacionesActivas)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    postulacionesActivas
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-red-600 text-white shadow-xs"
                  }`}
                >
                  {postulacionesActivas ? "Abierto" : "Cerrado"}
                </button>
              </div>

              {/* Grid Simple: Calendario HeroUI + Mensaje Editable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
                {/* Calendario HeroUI */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#0064c1]">
                    Fecha límite
                  </label>
                  <div className="p-2.5 rounded-2xl border border-black/[0.08] bg-white flex justify-center">
                    <Calendar aria-label="Fecha de cierre de postulaciones">
                      <Calendar.Header>
                        <Calendar.Heading />
                        <Calendar.NavButton slot="previous" />
                        <Calendar.NavButton slot="next" />
                      </Calendar.Header>
                      <Calendar.Grid>
                        <Calendar.GridHeader>
                          {(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}
                        </Calendar.GridHeader>
                        <Calendar.GridBody>
                          {(date) => <Calendar.Cell date={date} />}
                        </Calendar.GridBody>
                      </Calendar.Grid>
                    </Calendar>
                  </div>
                </div>

                {/* Mensaje Editable */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#0064c1]">
                    Mensaje de cierre
                  </label>
                  <textarea
                    rows={8}
                    value={mensajeCierre}
                    onChange={(e) => setMensajeCierre(e.target.value)}
                    placeholder="Escribe el mensaje que verán los usuarios al cerrar la convocatoria..."
                    className="w-full p-3.5 rounded-2xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Footer de Acciones del Modal */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setModalPostulacionesAbierto(false)}
                  className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarAjustesPostulacion}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-[#0064c1] hover:bg-[#0f2fe8] active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  Guardar ajustes
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Masivo (Renderizado con Portal al body) */}
      {montado &&
        modalMasivo &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60">
            <div className="flex flex-col gap-4 max-w-sm w-full p-6 rounded-[28px] bg-white shadow-2xl">
              <div className="flex items-center gap-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl font-bold ${
                    modalMasivo === "Aprobado"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {modalMasivo === "Aprobado" ? (
                    <CheckCircleIcon size={22} strokeWidth={2} />
                  ) : (
                    <DangerTriangleIcon size={22} strokeWidth={2} />
                  )}
                </span>
                <div className="flex flex-col">
                  <h3 className="m-0 text-base font-bold text-[#0a0a0a]">
                    {modalMasivo === "Aprobado" ? "¿Aprobar grupo?" : "¿Rechazar grupo?"}
                  </h3>
                  <span className="text-xs text-[#787774]">
                    {totalSeleccionados} aspirantes seleccionados
                  </span>
                </div>
              </div>

              <p className="m-0 text-xs text-[#2f3437] leading-relaxed">
                {modalMasivo === "Aprobado"
                  ? `¿Deseas autorizar formalmente la inscripción de los ${totalSeleccionados} aspirantes marcados en la Red de Aprendizaje?`
                  : `¿Deseas rechazar las ${totalSeleccionados} solicitudes marcadas?`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setModalMasivo(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => ejecutarAccionMasiva(modalMasivo)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold text-white active:scale-95 transition-all shadow-sm cursor-pointer ${
                    modalMasivo === "Aprobado"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {modalMasivo === "Aprobado" ? "Sí, aprobar grupo" : "Sí, rechazar grupo"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
export default TablaInscripcionesRed;
