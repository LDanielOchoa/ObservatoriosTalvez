"use client";

import React, { useState, useMemo } from "react";
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
  UsersGroupRoundedIcon,
} from "@solar-icons/react/outline";
import type { UsuarioRed } from "../services/usuarios.types";

interface Props {
  usuarios: UsuarioRed[];
}

type CampoOrden = "nombre" | "cedula" | "carrera" | "universidad" | "estado";
type DireccionOrden = "asc" | "desc";
type FiltroEstado = "Todos" | "Activo" | "Pendiente" | "Inactivo";

const FILAS_POR_PAGINA = 10;

export const TablaUsuarios: React.FC<Props> = ({ usuarios: usuariosIniciales }) => {
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioRed[]>(usuariosIniciales);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todos");
  const [pagina, setPagina] = useState(1);
  const [columnaOrden, setColumnaOrden] = useState<CampoOrden>("nombre");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("asc");

  // Estado para Modal de Eliminación Unitaria
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioRed | null>(null);

  // Estado para Modal de Eliminación Masiva
  const [modalMasivoEliminar, setModalMasivoEliminar] = useState(false);

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
  const usuariosProcesados = useMemo(() => {
    let resultado = listaUsuarios.filter((usuario) => {
      // Filtro por Estado
      if (filtroEstado !== "Todos" && usuario.estado !== filtroEstado) {
        return false;
      }
      // Filtro por Búsqueda
      const termino = busqueda.toLowerCase().trim();
      if (!termino) return true;
      return (
        usuario.nombre.toLowerCase().includes(termino) ||
        usuario.cedula.includes(termino) ||
        usuario.carrera.toLowerCase().includes(termino) ||
        usuario.universidad.toLowerCase().includes(termino) ||
        usuario.telefono.includes(termino)
      );
    });

    resultado.sort((a, b) => {
      const valorA = a[columnaOrden] || "";
      const valorB = b[columnaOrden] || "";
      const comparacion = valorA.localeCompare(valorB, "es", { numeric: true });
      return direccionOrden === "asc" ? comparacion : -comparacion;
    });

    return resultado;
  }, [listaUsuarios, busqueda, filtroEstado, columnaOrden, direccionOrden]);

  // Paginación
  const totalRegistros = usuariosProcesados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / FILAS_POR_PAGINA));

  const usuariosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * FILAS_POR_PAGINA;
    return usuariosProcesados.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [usuariosProcesados, pagina]);

  const inicioRango = totalRegistros === 0 ? 0 : (pagina - 1) * FILAS_POR_PAGINA + 1;
  const finRango = Math.min(pagina * FILAS_POR_PAGINA, totalRegistros);

  // IDs seleccionados mediante HeroUI
  const idsSeleccionados = useMemo(() => {
    if (selectedKeys === "all") {
      return usuariosProcesados.map((u) => u.id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, usuariosProcesados]);

  const totalSeleccionados = idsSeleccionados.length;

  // Acciones: Eliminar Unitario
  const confirmarEliminacion = () => {
    if (!usuarioAEliminar) return;
    const nombreEliminado = usuarioAEliminar.nombre;
    setListaUsuarios((prev) => prev.filter((u) => u.id !== usuarioAEliminar.id));
    setUsuarioAEliminar(null);
    toast.success("Usuario eliminado", {
      description: `Se eliminó correctamente a "${nombreEliminado}".`,
    });
  };

  // Acciones: Eliminar Masivo
  const confirmarEliminacionMasiva = () => {
    if (idsSeleccionados.length === 0) return;
    const totalAfectados = idsSeleccionados.length;
    setListaUsuarios((prev) => prev.filter((u) => !idsSeleccionados.includes(u.id)));
    setSelectedKeys(new Set());
    setModalMasivoEliminar(false);
    toast.success("Usuarios eliminados", {
      description: `Se eliminaron ${totalAfectados} usuarios seleccionados exitosamente.`,
    });
  };

  return (
    <div className="flex flex-col gap-5 w-full relative">
      {/* Proveedor oficial de Toasts de HeroUI */}
      <Toast.Provider placement="top" />

      {/* Barra de Filtros, Búsqueda y Acciones Grupales */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador */}
          <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/80 shadow-[0_4px_16px_-4px_rgba(9,60,120,0.1)] w-full sm:w-80">
            <RoundedMagnifierZoomInIcon size={16} className="text-[#787774] shrink-0" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nombre, cédula, carrera..."
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

          {/* Filtro por Estado (Tabs) */}
          <div className="inline-flex p-1 rounded-full bg-black/[0.04] border border-black/[0.04]">
            {(["Todos", "Activo", "Pendiente", "Inactivo"] as FiltroEstado[]).map((tab) => (
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
              <span className="text-xs font-semibold text-[#787774]">Registros totales:</span>
              <span className="font-mono text-xs font-bold text-[#0064c1] bg-[#0064c1]/10 px-3 py-1 rounded-full">
                {totalRegistros}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Contenedor de la Tabla con HeroUI Table & Checkbox */}
      <div className="overflow-hidden rounded-[28px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <Table>
          <Table.ScrollContainer className="custom-scrollbar">
            <Table.Content
              aria-label="Tabla de usuarios registrados"
              className="w-full text-left"
              selectedKeys={selectedKeys}
              selectionMode="multiple"
              onSelectionChange={setSelectedKeys}
            >
              <Table.Header>
                {/* Checkbox HeroUI Header */}
                <Table.Column className="py-4 px-4 w-10 pe-0">
                  <Checkbox aria-label="Seleccionar todos" slot="selection">
                    <Checkbox.Content>
                      <Checkbox.Control>
                        <Checkbox.Indicator />
                      </Checkbox.Control>
                    </Checkbox.Content>
                  </Checkbox>
                </Table.Column>

                {/* Columna Nombre */}
                <Table.Column
                  onClick={() => manejarOrden("nombre")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Estudiante / Usuario</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "nombre" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Cédula & Teléfono */}
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

                {/* Columna Programa */}
                <Table.Column
                  onClick={() => manejarOrden("carrera")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Programa Académico</span>
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

                {/* Columna Acciones */}
                <Table.Column className="py-4 px-5 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] text-right">
                  Acciones
                </Table.Column>
              </Table.Header>

              <Table.Body>
                {usuariosPaginados.length === 0 ? (
                  <Table.Row id="empty-row">
                    <Table.Cell className="py-16 text-center" colSpan={7}>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black/[0.04] text-[#787774]">
                          <UsersGroupRoundedIcon size={24} strokeWidth={1.5} />
                        </div>
                        <span className="text-sm font-bold text-[#0a0a0a]">No hay usuarios registrados</span>
                        <p className="text-xs text-[#787774] m-0">No se encontraron resultados que coincidan con los filtros aplicados.</p>
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
                  usuariosPaginados.map((user) => (
                    <Table.Row key={user.id} id={user.id} className="transition-colors hover:bg-black/[0.02] group/row">
                      {/* Checkbox HeroUI Row */}
                      <Table.Cell className="py-4 px-4 pe-0">
                        <Checkbox
                          aria-label={`Seleccionar a ${user.nombre}`}
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

                      {/* Nombre */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white text-xs font-bold shadow-xs"
                            style={{
                              backgroundImage:
                                "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                              boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6), 0 2px 8px -2px rgba(58,138,244,0.4)",
                            }}
                          >
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0a0a0a] group-hover/row:text-[#0064c1] transition-colors">
                              {user.nombre}
                            </span>
                            <span className="text-[0.7rem] text-[#787774]">
                              Nacimiento: {user.fechaNacimiento}
                            </span>
                          </div>
                        </div>
                      </Table.Cell>

                      {/* Cédula & Teléfono */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-semibold text-[#0a0a0a]">CC: {user.cedula}</span>
                          <span className="text-[0.72rem] text-[#787774]">Tel: {user.telefono}</span>
                        </div>
                      </Table.Cell>

                      {/* Carrera & Semestre */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-[#0a0a0a]">{user.carrera}</span>
                          <span className="text-[0.7rem] font-medium text-[#0064c1] bg-[#0064c1]/[0.08] px-2 py-0.5 rounded-md w-fit">
                            {user.semestre}
                          </span>
                        </div>
                      </Table.Cell>

                      {/* Universidad */}
                      <Table.Cell className="py-4 px-4">
                        <span className="text-[#2f3437] font-medium">{user.universidad}</span>
                      </Table.Cell>

                      {/* Estado */}
                      <Table.Cell className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[0.7rem] font-bold px-2.5 py-1 rounded-full ${
                            user.estado === "Activo"
                              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                              : user.estado === "Pendiente"
                              ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                              : "bg-black/[0.06] text-[#787774] border border-black/[0.08]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              user.estado === "Activo"
                                ? "bg-emerald-500"
                                : user.estado === "Pendiente"
                                ? "bg-amber-500"
                                : "bg-[#787774]"
                            }`}
                          />
                          {user.estado}
                        </span>
                      </Table.Cell>

                      {/* Acciones (Editar en Página / Eliminar con Popover Inline) */}
                      <Table.Cell className="py-4 px-5 text-right relative">
                        <div className="inline-flex items-center gap-1.5 relative">
                          <a
                            href={`/dashboard/usuarios/editar/${user.id}`}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#787774] hover:text-[#0064c1] hover:bg-[#0064c1]/10 transition-colors cursor-pointer"
                            title="Editar usuario en página"
                          >
                            <Pen2Icon size={16} strokeWidth={1.8} />
                          </a>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setUsuarioAEliminar(usuarioAEliminar?.id === user.id ? null : user)
                              }
                              className={`grid h-8 w-8 place-items-center rounded-lg transition-colors cursor-pointer ${
                                usuarioAEliminar?.id === user.id
                                  ? "bg-red-600 text-white shadow-xs"
                                  : "text-[#787774] hover:text-red-600 hover:bg-red-50"
                              }`}
                              title="Eliminar usuario"
                            >
                              <TrashBinMinimalisticIcon size={16} strokeWidth={1.8} />
                            </button>

                            {/* Mini Popover de Confirmación junto al botón */}
                            {usuarioAEliminar?.id === user.id && (
                              <div className="absolute right-0 top-10 z-50 flex flex-col gap-2.5 w-64 p-3.5 rounded-2xl bg-white border border-black/10 shadow-[0_16px_36px_-10px_rgba(0,0,0,0.2)] text-left animate-rise">
                                <div className="flex items-center gap-2">
                                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-50 text-red-600 shrink-0">
                                    <DangerTriangleIcon size={16} strokeWidth={2} />
                                  </span>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-[#0a0a0a] truncate leading-tight">
                                      ¿Eliminar usuario?
                                    </span>
                                    <span className="text-[0.66rem] text-[#787774] truncate">
                                      {user.nombre}
                                    </span>
                                  </div>
                                </div>

                                <p className="m-0 text-[0.72rem] text-[#2f3437] leading-tight">
                                  Esta acción no se puede deshacer.
                                </p>

                                <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-black/[0.06]">
                                  <button
                                    type="button"
                                    onClick={() => setUsuarioAEliminar(null)}
                                    className="px-2.5 py-1 rounded-lg text-[0.72rem] font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={confirmarEliminacion}
                                    className="px-3 py-1 rounded-lg text-[0.72rem] font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-xs cursor-pointer"
                                  >
                                    Sí, borrar
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

        {/* Paginación y Resumen de Selección */}
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
            {/* Prev */}
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

            {/* Números de página */}
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

            {/* Next */}
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

      {/* Modal Masivo de Eliminación */}
      {modalMasivoEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-rise">
          <div className="flex flex-col gap-4 max-w-sm w-full p-6 rounded-[28px] bg-white border border-black/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 font-bold">
                <DangerTriangleIcon size={22} strokeWidth={2} />
              </span>
              <div className="flex flex-col">
                <h3 className="m-0 text-base font-bold text-[#0a0a0a]">¿Eliminar seleccionados?</h3>
                <span className="text-xs text-[#787774]">
                  {totalSeleccionados} usuarios marcados
                </span>
              </div>
            </div>

            <p className="m-0 text-xs text-[#2f3437] leading-relaxed">
              ¿Deseas eliminar permanentemente a los <strong>{totalSeleccionados} usuarios seleccionados</strong> del sistema? Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
              <button
                type="button"
                onClick={() => setModalMasivoEliminar(false)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacionMasiva}
                className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm cursor-pointer"
              >
                Sí, eliminar grupo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TablaUsuarios;
