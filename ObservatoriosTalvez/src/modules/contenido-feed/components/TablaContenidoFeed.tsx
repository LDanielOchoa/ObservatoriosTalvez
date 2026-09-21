"use client";

import React, { useState, useMemo, useEffect } from "react";
import type { Selection } from "@heroui/react";
import { Checkbox, Table, Tabs, Toast, toast } from "@heroui/react";
import {
  Pen2Icon,
  TrashBinMinimalisticIcon,
  DangerTriangleIcon,
  RoundedMagnifierZoomInIcon,
  CloseCircleIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  NotesIcon,
  VideocameraIcon,
  LinkRoundIcon,
  AddCircleIcon,
  RefreshIcon,
  InboxIcon,
  StarsMinimalisticIcon,
  LikeIcon,
} from "@solar-icons/react/outline";
import type { ItemFeedAdmin, TipoFeed } from "../services/contenido-feed.types";

interface Props {
  items?: ItemFeedAdmin[];
}

const FILAS_POR_PAGINA = 8;

export const TablaContenidoFeed: React.FC<Props> = ({ items: itemsIniciales = [] }) => {
  const [lista, setLista] = useState<ItemFeedAdmin[]>(itemsIniciales || []);
  const [tabActiva, setTabActiva] = useState<TipoFeed>("noticia");
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(false);

  // Estados para eliminación
  const [itemAEliminar, setItemAEliminar] = useState<ItemFeedAdmin | null>(null);
  const [modalMasivoEliminar, setModalMasivoEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [actualizandoDestacadoId, setActualizandoDestacadoId] = useState<string | null>(null);

  // Alternar Destacado exclusivo por tipo
  const toggleDestacado = async (item: ItemFeedAdmin) => {
    const nuevoDestacado = !item.destacado;
    const itemTipo = item.tipo;
    const listaAnterior = [...lista];

    // Actualización optimista: solo 1 destacado por tipo
    setLista((prev) =>
      prev.map((i) => {
        if (i.id === item.id) {
          return { ...i, destacado: nuevoDestacado };
        }
        if (nuevoDestacado && i.tipo === itemTipo) {
          return { ...i, destacado: false };
        }
        return i;
      })
    );

    setActualizandoDestacadoId(item.id);

    try {
      const resp = await fetch("/api/contenido-feed/destacar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.id,
          tipo: item.tipo,
          destacado: nuevoDestacado,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "No se pudo actualizar el estado de destacado.");
      }

      if (nuevoDestacado) {
        toast.success("Contenido Destacado", {
          description: `"${item.titulo}" es ahora el contenido destacado de ${item.tipo === "noticia" ? "Noticias" : "YouTube"}.`,
        });
      } else {
        toast.info("Destacado removido", {
          description: `"${item.titulo}" ya no está marcado como destacado.`,
        });
      }
    } catch (err: any) {
      // Revertir optimismo
      setLista(listaAnterior);
      toast.danger("Error al cambiar destacado", {
        description: err.message || "Ocurrió un problema de conexión.",
      });
    } finally {
      setActualizandoDestacadoId(null);
    }
  };

  // Recargar datos desde la API
  const recargarDatos = async () => {
    setCargando(true);
    try {
      const resp = await fetch("/api/contenido-feed");
      if (resp.ok) {
        const data = await resp.json();
        setLista(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al recargar contenido feed:", err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!itemsIniciales || itemsIniciales.length === 0) {
      recargarDatos();
    }
  }, []);

  // Filtrar items por pestaña (noticia vs youtube) y búsqueda
  const itemsFiltrados = useMemo(() => {
    const listaValida = Array.isArray(lista) ? lista : [];
    let resultado = listaValida.filter((item) => item.tipo === tabActiva);

    const termino = busqueda.toLowerCase().trim();
    if (termino) {
      resultado = resultado.filter(
        (item) =>
          (item.titulo && item.titulo.toLowerCase().includes(termino)) ||
          (item.descripcion && item.descripcion.toLowerCase().includes(termino)) ||
          (item.fuenteOCanal && item.fuenteOCanal.toLowerCase().includes(termino)) ||
          (item.enlace && item.enlace.toLowerCase().includes(termino))
      );
    }
    return resultado;
  }, [lista, tabActiva, busqueda]);

  // Paginación
  const totalRegistros = itemsFiltrados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / FILAS_POR_PAGINA));

  const itemsPaginados = useMemo(() => {
    const inicio = (pagina - 1) * FILAS_POR_PAGINA;
    return itemsFiltrados.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [itemsFiltrados, pagina]);

  const inicioRango = totalRegistros === 0 ? 0 : (pagina - 1) * FILAS_POR_PAGINA + 1;
  const finRango = Math.min(pagina * FILAS_POR_PAGINA, totalRegistros);

  // IDs seleccionados
  const idsSeleccionados = useMemo(() => {
    if (selectedKeys === "all") {
      return itemsFiltrados.map((item) => item.id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, itemsFiltrados]);

  const totalSeleccionados = idsSeleccionados.length;

  // Acciones: Eliminar unitario
  const confirmarEliminacion = async () => {
    if (!itemAEliminar) return;
    const idParaEliminar = itemAEliminar.id;
    const tituloEliminado = itemAEliminar.titulo;

    setEliminando(true);

    try {
      const resp = await fetch(`/api/contenido-feed/${idParaEliminar}`, {
        method: "DELETE",
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo eliminar el elemento.");
      }

      setLista((prev) => prev.filter((i) => i.id !== idParaEliminar));
      setItemAEliminar(null);
      toast.success("Enlace eliminado", {
        description: `Se eliminó "${tituloEliminado}" del feed.`,
      });
    } catch (err: any) {
      toast.danger("Error al eliminar", {
        description: err.message || "No fue posible eliminar el registro.",
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
      const resp = await fetch("/api/contenido-feed", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: idsSeleccionados }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudieron eliminar los elementos.");
      }

      setLista((prev) => prev.filter((i) => !idsSeleccionados.includes(i.id)));
      setSelectedKeys(new Set());
      setModalMasivoEliminar(false);
      toast.success("Enlaces eliminados", {
        description: `Se eliminaron ${totalAfectados} elementos del feed exitosamente.`,
      });
    } catch (err: any) {
      toast.danger("Error en eliminación masiva", {
        description: err.message || "No fue posible eliminar los registros seleccionados.",
      });
    } finally {
      setEliminando(false);
    }
  };

  const conteoNoticias = Array.isArray(lista) ? lista.filter((i) => i.tipo === "noticia").length : 0;
  const conteoYoutube = Array.isArray(lista) ? lista.filter((i) => i.tipo === "youtube").length : 0;

  return (
    <div className="flex flex-col gap-6 w-full relative">
      <Toast.Provider placement="top" />

      {/* Tabs HeroUI para alternar entre Noticias y YouTube */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs
          className="w-full sm:w-auto"
          selectedKey={tabActiva}
          onSelectionChange={(key) => {
            setTabActiva(key as TipoFeed);
            setSelectedKeys(new Set());
            setPagina(1);
          }}
        >
          <Tabs.ListContainer>
            <Tabs.List aria-label="Tipos de Feed">
              <Tabs.Tab id="noticia" className="flex items-center gap-2 px-4 py-2 cursor-pointer">
                <NotesIcon size={16} strokeWidth={1.8} />
                <span>News Feed</span>
                <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-[#0064c1]/10 text-[#0064c1] font-bold font-mono">
                  {conteoNoticias}
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>

              <Tabs.Tab id="youtube" className="flex items-center gap-2 px-4 py-2 cursor-pointer">
                <VideocameraIcon size={16} strokeWidth={1.8} />
                <span>YouTube Feed</span>
                <span className="text-[0.68rem] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-bold font-mono">
                  {conteoYoutube}
                </span>
                <Tabs.Indicator />
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>

        {/* Acciones Superiores: Sincronizar y Cargar */}
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={recargarDatos}
            disabled={cargando}
            title="Sincronizar con Supabase"
            className="grid h-9 w-9 place-items-center rounded-full bg-white border border-black/10 text-[#787774] hover:text-[#0064c1] hover:border-[#0064c1]/40 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshIcon size={16} className={cargando ? "animate-spin text-[#0064c1]" : ""} />
          </button>

          <a
            href="/dashboard/contenido-feed/nuevo"
            className="group/btn relative inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm"
            style={{
              backgroundImage:
                "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
              boxShadow:
                "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
            }}
          >
            <AddCircleIcon size={16} strokeWidth={2} className="relative z-10" />
            <span className="relative z-10">Cargar nuevo enlace</span>
          </a>
        </div>
      </div>

      {/* Barra de Búsqueda y Selección */}
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
            placeholder={`Buscar en ${tabActiva === "noticia" ? "Noticias" : "Videos YouTube"}...`}
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

        {/* Acciones Masivas o Contador */}
        <div className="flex items-center gap-2">
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
                Eliminar seleccionados
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#787774]">Total registrados:</span>
              <span className="font-mono text-xs font-bold text-[#0064c1] bg-[#0064c1]/10 px-3 py-1 rounded-full">
                {totalRegistros}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-hidden rounded-[28px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <Table>
          <Table.ScrollContainer className="custom-scrollbar">
            <Table.Content
              aria-label={`Tabla de ${tabActiva === "noticia" ? "Noticias" : "Videos de YouTube"}`}
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
                  Contenido / Portada
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                  Fuente / Canal
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                  Enlace Original
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-center">
                  Estado
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-amber-600 text-center">
                  Destacado
                </Table.Column>

                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-center">
                  Likes
                </Table.Column>

                <Table.Column className="py-4 px-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-right">
                  Acciones
                </Table.Column>
              </Table.Header>

              <Table.Body>
                {itemsPaginados.length === 0 ? (
                  <Table.Row id="fila-vacia">
                    <Table.Cell className="py-16 text-center" colSpan={8}>
                      <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0064c1]/10 text-[#0064c1]">
                          <InboxIcon size={28} strokeWidth={1.5} />
                        </div>
                        <div className="flex flex-col gap-1 text-center">
                          <span className="text-sm font-bold text-[#0a0a0a]">
                            No hay {tabActiva === "noticia" ? "noticias" : "videos de YouTube"} registrados
                          </span>
                          <p className="text-xs text-[#787774] m-0 leading-relaxed">
                            {busqueda
                              ? "No se encontraron coincidencias para tu búsqueda actual."
                              : "Carga un nuevo enlace para que aparezca en el feed del Observatorio."}
                          </p>
                        </div>
                        {!busqueda && (
                          <a
                            href="/dashboard/contenido-feed/nuevo"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-[#0064c1] bg-[#0064c1]/10 hover:bg-[#0064c1]/15 transition-all mt-1 cursor-pointer"
                          >
                            <AddCircleIcon size={14} strokeWidth={2} />
                            <span>Cargar primer enlace</span>
                          </a>
                        )}
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  itemsPaginados.map((item) => (
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

                      {/* Contenido / Miniatura & Título */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex items-center gap-3.5 max-w-md">
                          {item.imagen ? (
                            <img
                              src={item.imagen}
                              alt={item.titulo}
                              className="h-12 w-18 shrink-0 rounded-xl object-cover border border-black/10 shadow-xs"
                            />
                          ) : (
                            <div className="h-12 w-18 shrink-0 rounded-xl bg-black/[0.05] grid place-items-center text-[#787774] text-xs font-bold">
                              Sin foto
                            </div>
                          )}
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-[#0a0a0a] group-hover/row:text-[#0064c1] transition-colors line-clamp-2 leading-tight">
                                {item.titulo}
                              </span>
                              {item.destacado && (
                                <span className="inline-flex items-center gap-0.5 text-[0.62rem] font-bold uppercase tracking-wider text-amber-800 bg-amber-500/20 px-1.5 py-0.5 rounded-md shrink-0 border border-amber-500/30">
                                  <StarsMinimalisticIcon size={10} strokeWidth={2.5} className="text-amber-600" />
                                  Top
                                </span>
                              )}
                            </div>
                            <span className="text-[0.7rem] text-[#787774] line-clamp-1">
                              {item.descripcion}
                            </span>
                          </div>
                        </div>
                      </Table.Cell>

                      {/* Fuente / Canal */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[#0a0a0a] text-xs">
                            {item.fuenteOCanal || "Web"}
                          </span>
                          <span className="text-[0.7rem] text-[#787774]">
                            {item.duracionOLectura}
                          </span>
                        </div>
                      </Table.Cell>

                      {/* Enlace Original */}
                      <Table.Cell className="py-4 px-4">
                        <a
                          href={item.enlace}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-[#0064c1] hover:underline font-mono max-w-[200px] truncate"
                          title={item.enlace}
                        >
                          <LinkRoundIcon size={14} className="shrink-0" />
                          <span className="truncate">{item.enlace}</span>
                        </a>
                      </Table.Cell>

                      {/* Estado */}
                      <Table.Cell className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[0.7rem] font-bold px-2.5 py-1 rounded-full ${
                            item.estado === "Publicado"
                              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                              : "bg-black/[0.06] text-[#787774] border border-black/[0.08]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              item.estado === "Publicado" ? "bg-emerald-500" : "bg-zinc-400"
                            }`}
                          />
                          {item.estado}
                        </span>
                      </Table.Cell>

                      {/* Destacado Exclusivo */}
                      <Table.Cell className="py-4 px-4 text-center">
                        <button
                          type="button"
                          disabled={actualizandoDestacadoId === item.id}
                          onClick={() => toggleDestacado(item)}
                          title={
                            item.destacado
                              ? "Destacado activo. Haz clic para desmarcar."
                              : `Haz clic para marcar como el único destacado de ${item.tipo === "noticia" ? "Noticias" : "YouTube"}.`
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                            item.destacado
                              ? "bg-amber-500/15 text-amber-800 border border-amber-500/35 shadow-[0_2px_10px_-2px_rgba(245,158,11,0.35)]"
                              : "bg-black/[0.03] text-[#787774] border border-black/[0.08] hover:text-amber-800 hover:border-amber-500/30 hover:bg-amber-500/10"
                          } ${actualizandoDestacadoId === item.id ? "opacity-50 pointer-events-none" : ""}`}
                        >
                          {item.destacado ? (
                            <StarsMinimalisticIcon size={14} strokeWidth={2.5} className="text-amber-500 animate-pulse" />
                          ) : (
                            <StarsMinimalisticIcon size={14} className="text-[#787774]" />
                          )}
                          <span>{item.destacado ? "Destacado" : "Normal"}</span>
                        </button>
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
                            href={`/dashboard/contenido-feed/editar/${item.id}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#787774] hover:text-[#0064c1] hover:bg-[#0064c1]/10 transition-colors cursor-pointer"
                            title="Editar enlace"
                          >
                            <Pen2Icon size={16} strokeWidth={1.8} />
                          </a>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setItemAEliminar(itemAEliminar?.id === item.id ? null : item)
                              }
                              className={`grid h-8 w-8 place-items-center rounded-lg transition-colors cursor-pointer ${
                                itemAEliminar?.id === item.id
                                  ? "bg-red-600 text-white shadow-xs"
                                  : "text-[#787774] hover:text-red-600 hover:bg-red-50"
                              }`}
                              title="Eliminar del feed"
                            >
                              <TrashBinMinimalisticIcon size={16} strokeWidth={1.8} />
                            </button>

                            {/* Mini Popover de Confirmación */}
                            {itemAEliminar?.id === item.id && (
                              <div className="absolute right-0 top-10 z-50 flex flex-col gap-2.5 w-64 p-3.5 rounded-2xl bg-white border border-black/10 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.2)] text-left animate-rise">
                                <div className="flex items-center gap-2">
                                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-50 text-red-600 shrink-0">
                                    <DangerTriangleIcon size={16} strokeWidth={2} />
                                  </span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-[#0a0a0a] truncate leading-tight">
                                      ¿Eliminar del Feed?
                                    </span>
                                    <span className="text-[0.66rem] text-[#787774] truncate">
                                      {item.titulo}
                                    </span>
                                  </div>
                                </div>

                                <p className="m-0 text-[0.72rem] text-[#2f3437] leading-tight">
                                  Se despublicará del carrusel y de la base de datos.
                                </p>

                                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-black/[0.06]">
                                  <button
                                    type="button"
                                    disabled={eliminando}
                                    onClick={() => setItemAEliminar(null)}
                                    className="px-2.5 py-1 rounded-lg text-[0.72rem] font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    disabled={eliminando}
                                    onClick={confirmarEliminacion}
                                    className="px-3 py-1 rounded-lg text-[0.72rem] font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1"
                                  >
                                    {eliminando ? "Borrando..." : "Sí, borrar"}
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

      {/* Modal Masivo de Eliminación */}
      {modalMasivoEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-rise">
          <div className="flex flex-col gap-4 w-full max-w-md p-6 rounded-[28px] bg-white border border-black/10 shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-red-50 text-red-600 shrink-0">
                <DangerTriangleIcon size={22} strokeWidth={2} />
              </span>
              <div>
                <h3 className="m-0 text-base font-bold text-[#0a0a0a]">
                  ¿Eliminar {totalSeleccionados} contenidos seleccionados?
                </h3>
                <p className="m-0 text-xs text-[#787774]">
                  Esta acción no se puede deshacer y borrará permanentemente los enlaces del feed.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-black/[0.06]">
              <button
                type="button"
                disabled={eliminando}
                onClick={() => setModalMasivoEliminar(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminando}
                onClick={confirmarEliminacionMasiva}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {eliminando ? "Eliminando..." : "Sí, eliminar todos"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TablaContenidoFeed;
