"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Selection } from "@heroui/react";
import { Checkbox, Table, Toast, toast } from "@heroui/react";
import {
  Pen2Icon,
  TrashBinMinimalisticIcon,
  DangerTriangleIcon,
  RoundedMagnifierZoomInIcon,
  CloseCircleIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  AddCircleIcon,
  RefreshIcon,
  InboxIcon,
  BookBookmarkIcon,
  GlobeIcon,
  LinkRoundIcon,
  LikeIcon,
} from "@solar-icons/react/outline";
import type { DocumentoRepositorio } from "../services/repositorio.types";

interface Props {
  documentosIniciales?: DocumentoRepositorio[];
}

const FILAS_POR_PAGINA = 8;

export const TablaContenidoRepositorio: React.FC<Props> = ({ documentosIniciales = [] }) => {
  const [montado, setMontado] = useState(false);
  const [lista, setLista] = useState<DocumentoRepositorio[]>(documentosIniciales || []);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [filtroPais, setFiltroPais] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);

  // Estados de eliminación
  const [itemAEliminar, setItemAEliminar] = useState<DocumentoRepositorio | null>(null);
  const [modalMasivoEliminar, setModalMasivoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  // Recargar datos desde la API
  const recargarDatos = async () => {
    setCargando(true);
    try {
      const resp = await fetch("/api/repositorio");
      if (resp.ok) {
        const data = await resp.json();
        setLista(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al recargar documentos del repositorio:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!documentosIniciales || documentosIniciales.length === 0) {
      recargarDatos();
    }
  }, []);

  // Extraer opciones únicas para filtros
  const opcionesPaises = useMemo(() => {
    const conjunto = new Set<string>();
    lista.forEach((d) => {
      if (d.pais) conjunto.add(d.pais);
    });
    return Array.from(conjunto).sort();
  }, [lista]);

  const opcionesTipos = useMemo(() => {
    const conjunto = new Set<string>();
    lista.forEach((d) => {
      if (d.tipoFuente) conjunto.add(d.tipoFuente);
    });
    return Array.from(conjunto).sort();
  }, [lista]);

  // Filtrado de documentos
  const documentosFiltrados = useMemo(() => {
    const listaValida = Array.isArray(lista) ? lista : [];
    let resultado = listaValida;

    if (filtroPais !== "todos") {
      resultado = resultado.filter((d) => d.pais === filtroPais);
    }

    if (filtroTipo !== "todos") {
      resultado = resultado.filter((d) => d.tipoFuente === filtroTipo);
    }

    const termino = busqueda.toLowerCase().trim();
    if (termino) {
      resultado = resultado.filter(
        (d) =>
          d.titulo?.toLowerCase().includes(termino) ||
          d.lineaInvestigacion?.toLowerCase().includes(termino) ||
          d.categoria?.toLowerCase().includes(termino) ||
          d.resumen?.toLowerCase().includes(termino) ||
          d.ano?.includes(termino) ||
          d.autores?.some((a) => a.toLowerCase().includes(termino)) ||
          d.paginasWeb?.some((p) => p.toLowerCase().includes(termino))
      );
    }

    return resultado;
  }, [lista, filtroPais, filtroTipo, busqueda]);

  // Paginación
  const totalRegistros = documentosFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / FILAS_POR_PAGINA));

  const documentosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * FILAS_POR_PAGINA;
    return documentosFiltrados.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [documentosFiltrados, pagina]);

  const inicioRango = totalRegistros === 0 ? 0 : (pagina - 1) * FILAS_POR_PAGINA + 1;
  const finRango = Math.min(pagina * FILAS_POR_PAGINA, totalRegistros);

  // IDs seleccionados
  const idsSeleccionados = useMemo(() => {
    if (selectedKeys === "all") {
      return documentosFiltrados.map((d) => d.id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, documentosFiltrados]);

  const totalSeleccionados = idsSeleccionados.length;

  // Acciones: Eliminar unitario
  const confirmarEliminacion = async () => {
    if (!itemAEliminar) return;
    const idParaEliminar = itemAEliminar.id;
    const tituloEliminado = itemAEliminar.titulo;

    setEliminando(true);

    try {
      const resp = await fetch(`/api/repositorio/${idParaEliminar}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo eliminar el documento.");
      }

      setLista((prev) => prev.filter((d) => d.id !== idParaEliminar));
      setItemAEliminar(null);
      toast.success("Documento eliminado", {
        description: `Se eliminó "${tituloEliminado}" del repositorio.`,
      });
    } catch (err: any) {
      toast.danger("Error al eliminar", {
        description: err.message || "No fue posible eliminar el documento.",
      });
    } finally {
      setEliminando(false);
    }
  };

  // Acciones: Eliminar masivo
  const confirmarEliminacionMasiva = async () => {
    if (idsSeleccionados.length === 0) return;
    const totalAfectados = idsSeleccionados.length;

    setEliminando(true);

    try {
      const resp = await fetch("/api/repositorio", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: idsSeleccionados }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudieron eliminar los documentos.");
      }

      setLista((prev) => prev.filter((d) => !idsSeleccionados.includes(d.id)));
      setSelectedKeys(new Set());
      setModalMasivoEliminar(false);
      toast.success("Documentos eliminados", {
        description: `Se eliminaron ${totalAfectados} documentos del repositorio exitosamente.`,
      });
    } catch (err: any) {
      toast.danger("Error en eliminación masiva", {
        description: err.message || "No fue posible eliminar los documentos seleccionados.",
      });
    } finally {
      setEliminando(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full relative">
      <Toast.Provider placement="top" />

      {/* Barra de Búsqueda, Filtros y Acciones */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Búsqueda y Selectores de Filtro */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Input Buscador */}
          <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/80 shadow-[0_4px_16px_-4px_rgba(9,60,120,0.1)] w-full sm:w-72">
            <RoundedMagnifierZoomInIcon size={16} className="text-[#787774] shrink-0" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar título, autor, línea..."
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

          {/* Filtro País */}
          <select
            value={filtroPais}
            onChange={(e) => {
              setFiltroPais(e.target.value);
              setPagina(1);
            }}
            className="px-3.5 py-2.5 rounded-full bg-white/90 border border-white/80 shadow-[0_4px_16px_-4px_rgba(9,60,120,0.08)] text-xs font-semibold text-[#0a0a0a] outline-none cursor-pointer"
          >
            <option value="todos">Todos los países</option>
            {opcionesPaises.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* Filtro Tipo de Fuente */}
          <select
            value={filtroTipo}
            onChange={(e) => {
              setFiltroTipo(e.target.value);
              setPagina(1);
            }}
            className="px-3.5 py-2.5 rounded-full bg-white/90 border border-white/80 shadow-[0_4px_16px_-4px_rgba(9,60,120,0.08)] text-xs font-semibold text-[#0a0a0a] outline-none cursor-pointer"
          >
            <option value="todos">Todos los tipos</option>
            {opcionesTipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Botón Sincronizar */}
          <button
            type="button"
            onClick={recargarDatos}
            disabled={cargando}
            title="Sincronizar con Supabase"
            className="grid h-9 w-9 place-items-center rounded-full bg-white border border-black/10 text-[#787774] hover:text-[#0064c1] hover:border-[#0064c1]/40 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshIcon size={16} className={cargando ? "animate-spin text-[#0064c1]" : ""} />
          </button>
        </div>

        {/* Acciones Masivas, Contador y Botón Crear */}
        <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
          {totalSeleccionados > 0 ? (
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-full bg-red-500/10 border border-red-500/20 animate-rise">
              <span className="text-xs font-bold text-red-700 font-mono">
                {totalSeleccionados} seleccionados
              </span>
              <div className="h-3.5 w-px bg-red-500/30 mx-1" />
              <button
                type="button"
                onClick={() => setModalMasivoEliminar(true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <TrashBinMinimalisticIcon size={14} strokeWidth={2} />
                Eliminar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#787774]">Total:</span>
              <span className="font-mono text-xs font-bold text-[#0064c1] bg-[#0064c1]/10 px-3 py-1 rounded-full">
                {totalRegistros}
              </span>
            </div>
          )}

          {/* Botón Cargar Nuevo Documento */}
          <a
            href="/dashboard/contenido-repositorio/nuevo"
            className="group/btn relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm"
            style={{
              backgroundImage:
                "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
              boxShadow:
                "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
            }}
          >
            <AddCircleIcon size={16} strokeWidth={2} className="relative z-10" />
            <span className="relative z-10">Nuevo documento</span>
          </a>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-hidden rounded-[28px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <Table>
          <Table.ScrollContainer className="custom-scrollbar">
            <Table.Content
              aria-label="Tabla de documentos del repositorio"
              className="w-full text-left"
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              onSelectionChange={setSelectedKeys}
            >
              <Table.Header>
                <Table.Column className="py-4 px-4 w-10 pe-0">
                  <Checkbox aria-label="Seleccionar todos" slot="selection">
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                  Título / Documento
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                  Línea de Investigación
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                  Autores
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                  Tipo / País / Año
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-center">
                  Likes
                </Table.Column>

                <Table.Column className="py-4 px-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-right">
                  Acciones
                </Table.Column>
              </Table.Header>

              <Table.Body>
                {documentosPaginados.length === 0 ? (
                  <Table.Row id="fila-vacia-repositorio">
                    <Table.Cell className="py-16 text-center" colSpan={7}>
                      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0064c1]/10 text-[#0064c1]">
                          <InboxIcon size={28} strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col gap-1 text-center">
                          <span className="text-sm font-bold text-[#0a0a0a]">
                            No hay documentos registrados
                          </span>
                          <p className="text-xs text-[#787774] m-0 leading-relaxed">
                            {busqueda || filtroPais !== "todos" || filtroTipo !== "todos"
                              ? "No se encontraron coincidencias para los filtros aplicados."
                              : "Comienza registrando publicaciones científicas e investigaciones en el repositorio."}
                          </p>
                        </div>
                        {!busqueda && filtroPais === "todos" && filtroTipo === "todos" && (
                          <a
                            href="/dashboard/contenido-repositorio/nuevo"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#0064c1] bg-[#0064c1]/10 hover:bg-[#0064c1]/15 transition-all mt-1 cursor-pointer"
                          >
                            <AddCircleIcon size={14} strokeWidth={2} />
                            <span>Registrar primer documento</span>
                          </a>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  documentosPaginados.map((item) => (
                    <Table.Row key={item.id} id={item.id} className="transition-colors hover:bg-black/[0.02] group/row">
                      {/* Checkbox */}
                      <Table.Cell className="py-4 px-4 pe-0">
                        <Checkbox
                          aria-label={`Seleccionar ${item.titulo}`}
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

                      {/* Título & Resumen & Enlaces */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-1 max-w-md">
                          <span className="font-bold text-[#0a0a0a] text-xs leading-snug group-hover/row:text-[#0064c1] transition-colors line-clamp-2">
                            {item.titulo}
                          </span>
                          {/* Links / Páginas Web */}
                          {item.paginasWeb && item.paginasWeb.length > 0 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <a
                                href={item.paginasWeb[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[0.7rem] text-[#0064c1] hover:underline font-mono truncate max-w-[200px]"
                                title={item.paginasWeb[0]}
                              >
                                <LinkRoundIcon size={12} className="shrink-0" />
                                <span className="truncate">{item.paginasWeb[0]}</span>
                              </a>
                              {item.paginasWeb.length > 1 && (
                                <span
                                  className="text-[0.66rem] font-bold font-mono text-[#0064c1] bg-[#0064c1]/10 px-1.5 py-0.5 rounded-md"
                                  title={item.paginasWeb.join("\n")}
                                >
                                  +{item.paginasWeb.length - 1} enlaces
                                </span>
                              )}
                            </div>
                          ) : item.enlaceDocumento ? (
                            <a
                              href={item.enlaceDocumento}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[0.7rem] text-[#0064c1] hover:underline font-mono truncate max-w-[200px]"
                            >
                              <LinkRoundIcon size={12} className="shrink-0" />
                              <span className="truncate">{item.enlaceDocumento}</span>
                            </a>
                          ) : null}
                        </div>
                      </Table.Cell>

                      {/* Línea de Investigación y Categoría */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0a0a0a] bg-black/[0.03] px-2.5 py-1 rounded-lg">
                            <BookBookmarkIcon size={13} className="text-[#0064c1] shrink-0" />
                            <span className="truncate max-w-[160px]">{item.lineaInvestigacion}</span>
                          </span>
                          {item.categoria && (
                            <span className="text-[0.66rem] font-bold text-[#787774] bg-black/[0.04] px-2 py-0.5 rounded-full truncate max-w-[150px]">
                              {item.categoria}
                            </span>
                          )}
                        </div>
                      </Table.Cell>

                      {/* Autores */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-[#0a0a0a] truncate max-w-[180px]">
                            {item.autores && item.autores.length > 0 ? item.autores[0] : "Sin autor"}
                          </span>
                          {item.autores && item.autores.length > 1 && (
                            <span className="text-[0.68rem] text-[#787774]">
                              +{item.autores.length - 1} coautores más
                            </span>
                          )}
                        </div>
                      </Table.Cell>

                      {/* Tipo / País / Año */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-[#0a0a0a]">{item.tipoFuente}</span>
                            <span className="text-[#787774]">•</span>
                            <span className="font-mono font-bold text-[#0064c1]">{item.ano}</span>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[0.7rem] text-[#787774]">
                            <GlobeIcon size={11} />
                            {item.pais}
                          </span>
                        </div>
                      </Table.Cell>

                      {/* Likes Acumulados */}
                      <Table.Cell className="py-4 px-4 text-center">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0064c1]/[0.06] border border-[#0064c1]/15 text-[#0064c1]"
                          title={`${item.likesCount || 0} me gusta acumulados`}
                        >
                          <LikeIcon size={14} strokeWidth={1.8} />
                          <span className="font-mono text-xs font-bold select-none">
                            {item.likesCount || 0}
                          </span>
                        </span>
                      </Table.Cell>

                      {/* Acciones */}
                      <Table.Cell className="py-4 px-5 text-right relative">
                        <div className="inline-flex items-center gap-1.5 relative">
                          <a
                            href={`/dashboard/repositorio/${item.id}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#787774] hover:text-[#0064c1] hover:bg-[#0064c1]/10 transition-colors cursor-pointer"
                            title="Ver ficha pública"
                          >
                            <LinkRoundIcon size={16} strokeWidth={1.8} />
                          </a>

                          <a
                            href={`/dashboard/contenido-repositorio/editar/${item.id}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#787774] hover:text-[#0064c1] hover:bg-[#0064c1]/10 transition-colors cursor-pointer"
                            title="Editar documento"
                          >
                            <Pen2Icon size={16} strokeWidth={1.8} />
                          </a>

                          <button
                            type="button"
                            onClick={() => setItemAEliminar(item)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#787774] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar documento"
                          >
                            <TrashBinMinimalisticIcon size={16} strokeWidth={1.8} />
                          </button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {/* Paginación */}
        {totalRegistros > 0 && (
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
        )}
      </div>

      {/* Modal Unitario de Eliminación renderizado en document.body */}
      {itemAEliminar && montado && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-rise"
            onClick={(e) => {
              if (e.target === e.currentTarget && !eliminando) setItemAEliminar(null);
            }}
          >
            <div className="flex flex-col gap-4 max-w-sm w-full p-6 rounded-[28px] bg-white border border-black/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 font-bold">
                  <DangerTriangleIcon size={22} strokeWidth={2} />
                </span>
                <div className="flex flex-col min-w-0">
                  <h3 className="m-0 text-base font-bold text-[#0a0a0a]">¿Eliminar documento?</h3>
                  <span className="text-xs text-[#787774] truncate" title={itemAEliminar.titulo}>
                    {itemAEliminar.titulo}
                  </span>
                </div>
              </div>

              <p className="m-0 text-xs text-[#2f3437] leading-relaxed">
                Se eliminará de forma definitiva del repositorio institucional. Esta acción no se puede deshacer.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  disabled={eliminando}
                  onClick={() => setItemAEliminar(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={eliminando}
                  onClick={confirmarEliminacion}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {eliminando ? "Eliminando..." : "Sí, eliminar"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Modal Masivo de Eliminación renderizado en document.body */}
      {modalMasivoEliminar && montado && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-rise"
            onClick={(e) => {
              if (e.target === e.currentTarget && !eliminando) setModalMasivoEliminar(false);
            }}
          >
            <div className="flex flex-col gap-4 max-w-sm w-full p-6 rounded-[28px] bg-white border border-black/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 font-bold">
                  <DangerTriangleIcon size={22} strokeWidth={2} />
                </span>
                <div className="flex flex-col">
                  <h3 className="m-0 text-base font-bold text-[#0a0a0a]">¿Eliminar seleccionados?</h3>
                  <span className="text-xs text-[#787774]">
                    {totalSeleccionados} documentos marcados
                  </span>
                </div>
              </div>

              <p className="m-0 text-xs text-[#2f3437] leading-relaxed">
                ¿Deseas eliminar permanentemente los <strong>{totalSeleccionados} documentos seleccionados</strong> del repositorio? Esta acción no se puede deshacer.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  disabled={eliminando}
                  onClick={() => setModalMasivoEliminar(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={eliminando}
                  onClick={confirmarEliminacionMasiva}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  {eliminando ? "Eliminando..." : "Sí, eliminar grupo"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
export default TablaContenidoRepositorio;
