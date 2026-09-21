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
  UsersGroupRoundedIcon,
} from "@solar-icons/react/outline";
import type { UsuarioRed } from "../services/usuarios.types";
import { ServicioUsuarios } from "../services/usuarios.service";

interface Props {
  usuarios: UsuarioRed[];
}

type CampoOrden = "nombre" | "cedula" | "carrera" | "universidad" | "estado";
type DireccionOrden = "asc" | "desc";
type FiltroEstado = "Todos" | "Activo" | "Pendiente" | "Inactivo";

const FILAS_POR_PAGINA = 10;

export const TablaUsuarios: React.FC<Props> = ({ usuarios: usuariosIniciales }) => {
  const [montado, setMontado] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioRed[]>(usuariosIniciales);
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("Todos");
  const [pagina, setPagina] = useState(1);
  const [columnaOrden, setColumnaOrden] = useState<CampoOrden>("nombre");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("asc");

  useEffect(() => {
    setMontado(true);
  }, []);

  // Modal de Confirmación Masiva
  const [modalMasivoEliminar, setModalMasivoEliminar] = useState(false);

  // Popover de confirmación individual (Inline)
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioRed | null>(null);

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
    let resultado = listaUsuarios.filter((u) => {
      if (filtroEstado !== "Todos" && u.estado !== filtroEstado) {
        return false;
      }
      const termino = busqueda.toLowerCase().trim();
      if (!termino) return true;
      return (
        u.nombre.toLowerCase().includes(termino) ||
        u.cedula.includes(termino) ||
        u.carrera.toLowerCase().includes(termino) ||
        u.universidad.toLowerCase().includes(termino) ||
        u.telefono.includes(termino)
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
  const confirmarEliminacion = async () => {
    if (!usuarioAEliminar) return;
    const idEliminado = usuarioAEliminar.id;
    const nombreEliminado = usuarioAEliminar.nombre;
    setListaUsuarios((prev) => prev.filter((u) => u.id !== idEliminado));
    setUsuarioAEliminar(null);

    const res = await ServicioUsuarios.eliminarUsuario(idEliminado);
    if (res.exito) {
      toast.success("Usuario eliminado", {
        description: `Se eliminó a "${nombreEliminado}" correctamente.`,
      });
    } else {
      toast.danger("Error al eliminar", {
        description: res.mensaje || "No se pudo eliminar el estudiante.",
      });
    }
  };

  // Acciones: Eliminar Masivo
  const confirmarEliminacionMasiva = async () => {
    if (idsSeleccionados.length === 0) return;
    const totalAfectados = idsSeleccionados.length;
    const idsCopia = [...idsSeleccionados];

    setListaUsuarios((prev) => prev.filter((u) => !idsSeleccionados.includes(u.id)));
    setSelectedKeys(new Set());
    setModalMasivoEliminar(false);

    const res = await ServicioUsuarios.eliminarUsuariosMasivo(idsCopia);
    if (res.exito) {
      toast.success("Usuarios eliminados", {
        description: `Se eliminaron ${totalAfectados} usuarios exitosamente.`,
      });
    } else {
      toast.danger("Error al eliminar", {
        description: res.mensaje || "No se pudieron eliminar los estudiantes seleccionados.",
      });
    }
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
            <div className="inline-flex items-center gap-1.5 p-1 rounded-full bg-black/[0.04] backdrop-blur-md animate-rise">
              <span className="text-xs font-medium text-[#787774] px-2.5">
                <span className="font-semibold font-mono text-[#0a0a0a]">{totalSeleccionados}</span>{" "}
                {totalSeleccionados === 1 ? "seleccionado" : "seleccionados"}
              </span>
              <button
                type="button"
                onClick={() => setModalMasivoEliminar(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-red-700 bg-white hover:bg-red-600 hover:text-white shadow-xs active:scale-95 transition-all cursor-pointer"
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
        {usuariosProcesados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-black/[0.04] text-[#787774]">
              <UsersGroupRoundedIcon size={24} strokeWidth={1.5} />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-[#0a0a0a]">
                No hay usuarios registrados {filtroEstado !== "Todos" ? `en "${filtroEstado.toLowerCase()}"` : ""}
              </span>
              <p className="text-xs text-[#787774] m-0 max-w-sm">
                {busqueda
                  ? "No se encontraron usuarios que coincidan con los términos de búsqueda."
                  : `Actualmente no hay usuarios registrados con el estado "${filtroEstado}".`}
              </p>
            </div>
          </div>
        ) : (
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
                  {usuariosPaginados.map((user) => (
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

                      {/* Usuario */}
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
                            {user.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0a0a0a] group-hover/row:text-[#0064c1] transition-colors">
                              {user.nombre}
                            </span>
                            <span className="text-[0.7rem] text-[#787774]">
                              Registro: {user.fechaRegistro}
                            </span>
                          </div>
                        </div>
                      </Table.Cell>

                      {/* Identificación, Correo & Teléfono */}
                      <Table.Cell className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-semibold text-[#0a0a0a]">CC: {user.cedula}</span>
                          {user.email && (
                            <span className="text-[0.72rem] text-[#0064c1] font-medium truncate max-w-[190px]" title={user.email}>
                              {user.email}
                            </span>
                          )}
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

                          <button
                            type="button"
                            onClick={() => setUsuarioAEliminar(user)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-[#787774] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Eliminar usuario"
                          >
                            <TrashBinMinimalisticIcon size={16} strokeWidth={1.8} />
                          </button>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}

        {/* Paginación y Resumen de Selección */}
        {usuariosProcesados.length > 0 && (
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
      )}
    </div>

      {/* Modal de Eliminación Unitaria renderizado en document.body */}
      {usuarioAEliminar && montado && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 animate-rise"
            onClick={(e) => {
              if (e.target === e.currentTarget) setUsuarioAEliminar(null);
            }}
          >
            <div className="flex flex-col gap-4 max-w-sm w-full p-6 rounded-[28px] bg-white border border-black/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 font-bold">
                  <DangerTriangleIcon size={22} strokeWidth={2} />
                </span>
                <div className="flex flex-col min-w-0">
                  <h3 className="m-0 text-base font-bold text-[#0a0a0a]">¿Eliminar usuario?</h3>
                  <span className="text-xs text-[#787774] truncate">
                    {usuarioAEliminar.nombre} {usuarioAEliminar.email ? `(${usuarioAEliminar.email})` : `(CC: ${usuarioAEliminar.cedula})`}
                  </span>
                </div>
              </div>

              <p className="m-0 text-xs text-[#2f3437] leading-relaxed">
                Esta acción removerá permanentemente al estudiante y sus accesos de la plataforma.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setUsuarioAEliminar(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarEliminacion}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  Sí, eliminar
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
              if (e.target === e.currentTarget) setModalMasivoEliminar(false);
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
          </div>,
          document.body
        )}
    </div>
  );
};
export default TablaUsuarios;
