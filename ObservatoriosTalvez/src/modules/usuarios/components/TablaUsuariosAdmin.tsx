"use client";

import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import type { Selection } from "@heroui/react";
import { Checkbox, Table, Toast, toast } from "@heroui/react";
import {
  TrashBinMinimalisticIcon,
  Pen2Icon,
  DangerTriangleIcon,
  RoundedMagnifierZoomInIcon,
  CloseCircleIcon,
  AltArrowLeftIcon,
  AltArrowRightIcon,
  ShieldUserIcon,
  UserPlusIcon,
  CalendarMinimalisticIcon,
  EyeIcon,
  EyeClosedIcon,
  LockPasswordIcon,
  UserIcon,
  LetterIcon,
  RefreshIcon,
} from "@solar-icons/react/outline";
import { ServicioUsuariosAdmin } from "../services/usuarios-admin.service";
import type { UsuarioAdmin, RolAdmin, EstadoAdmin } from "../services/usuarios-admin.types";

interface Props {
  usuarios: UsuarioAdmin[];
}

type CampoOrden = "nombre" | "email" | "rol" | "fecha_creacion" | "estado";
type DireccionOrden = "asc" | "desc";
type FiltroRol = "Todos" | RolAdmin;

const FILAS_POR_PAGINA = 10;

export const TablaUsuariosAdmin: React.FC<Props> = ({ usuarios: usuariosIniciales }) => {
  const [montado, setMontado] = useState(false);
  const [listaUsuarios, setListaUsuarios] = useState<UsuarioAdmin[]>(usuariosIniciales);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setMontado(true);
    // Cargar datos frescos de Supabase al montar en el cliente
    recargarUsuarios();
  }, []);

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<FiltroRol>("Todos");
  const [pagina, setPagina] = useState(1);
  const [columnaOrden, setColumnaOrden] = useState<CampoOrden>("fecha_creacion");
  const [direccionOrden, setDireccionOrden] = useState<DireccionOrden>("desc");

  // Estado para Modal de Creación
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [nuevoRol, setNuevoRol] = useState<RolAdmin>("Administrador");
  const [errorFormulario, setErrorFormulario] = useState("");

  // Estado para Modal de Edición
  const [usuarioAEditar, setUsuarioAEditar] = useState<UsuarioAdmin | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRol, setEditRol] = useState<RolAdmin>("Administrador");
  const [editEstado, setEditEstado] = useState<EstadoAdmin>("Activo");
  const [editPassword, setEditPassword] = useState("");
  const [mostrarEditPassword, setMostrarEditPassword] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState("");

  // Estado para Modal de Eliminación Unitaria
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioAdmin | null>(null);

  // Estado para Modal de Eliminación Masiva
  const [modalMasivoEliminar, setModalMasivoEliminar] = useState(false);

  // Función para recargar la lista directamente desde Supabase
  const recargarUsuarios = async () => {
    setCargando(true);
    try {
      const datos = await ServicioUsuariosAdmin.obtenerUsuarios();
      setListaUsuarios(datos);
    } catch (error) {
      console.error("Error al cargar usuarios de Supabase:", error);
    } finally {
      setCargando(false);
    }
  };

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
    let resultado = listaUsuarios.filter((item) => {
      // Filtro por Rol
      if (filtroRol !== "Todos" && item.rol !== filtroRol) {
        return false;
      }
      // Filtro por Búsqueda
      const termino = busqueda.toLowerCase().trim();
      if (!termino) return true;
      return (
        item.nombre.toLowerCase().includes(termino) ||
        item.email.toLowerCase().includes(termino) ||
        item.rol.toLowerCase().includes(termino) ||
        item.fecha_creacion?.includes(termino)
      );
    });

    resultado.sort((a, b) => {
      const valorA = a[columnaOrden] || "";
      const valorB = b[columnaOrden] || "";
      const comparacion = valorA.localeCompare(valorB, "es", { numeric: true });
      return direccionOrden === "asc" ? comparacion : -comparacion;
    });

    return resultado;
  }, [listaUsuarios, busqueda, filtroRol, columnaOrden, direccionOrden]);

  // Paginación
  const totalRegistros = usuariosProcesados.length;
  const totalPaginas = Math.max(1, Math.ceil(totalRegistros / FILAS_POR_PAGINA));

  const usuariosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * FILAS_POR_PAGINA;
    return usuariosProcesados.slice(inicio, inicio + FILAS_POR_PAGINA);
  }, [usuariosProcesados, pagina]);

  const inicioRango = totalRegistros === 0 ? 0 : (pagina - 1) * FILAS_POR_PAGINA + 1;
  const finRango = Math.min(pagina * FILAS_POR_PAGINA, totalRegistros);

  // IDs seleccionados
  const idsSeleccionados = useMemo(() => {
    if (selectedKeys === "all") {
      return usuariosProcesados.map((u) => u.id);
    }
    return Array.from(selectedKeys) as string[];
  }, [selectedKeys, usuariosProcesados]);

  const totalSeleccionados = idsSeleccionados.length;

  // Manejo de creación de usuario administrativo en Supabase
  const manejarCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      setErrorFormulario("Por favor ingresa un nombre para el usuario.");
      return;
    }
    if (!nuevoEmail.trim() || !nuevoEmail.includes("@")) {
      setErrorFormulario("Por favor ingresa un correo electrónico válido.");
      return;
    }
    if (!nuevoPassword.trim() || nuevoPassword.length < 4) {
      setErrorFormulario("La contraseña debe tener al menos 4 caracteres.");
      return;
    }

    setGuardando(true);
    setErrorFormulario("");

    try {
      const usuarioCreado = await ServicioUsuariosAdmin.crearUsuario({
        nombre: nuevoNombre,
        email: nuevoEmail,
        password: nuevoPassword,
        rol: nuevoRol,
        estado: "Activo",
      });

      setListaUsuarios((prev) => [usuarioCreado, ...prev]);
      setNuevoNombre("");
      setNuevoEmail("");
      setNuevoPassword("");
      setNuevoRol("Administrador");
      setModalCrearAbierto(false);

      toast.success("Usuario registrado en Supabase", {
        description: `Se creó exitosamente a "${usuarioCreado.nombre}" con rol de ${usuarioCreado.rol}.`,
      });
    } catch (error: any) {
      console.error("Error al crear usuario:", error);
      setErrorFormulario(error.message || "Error al crear el usuario en Supabase.");
    } finally {
      setGuardando(false);
    }
  };

  // Abrir modal de edición
  const abrirModalEditar = (usuario: UsuarioAdmin) => {
    setUsuarioAEditar(usuario);
    setEditNombre(usuario.nombre);
    setEditEmail(usuario.email);
    setEditRol(usuario.rol);
    setEditEstado(usuario.estado);
    setEditPassword("");
    setErrorEdicion("");
  };

  // Manejo de edición de usuario administrativo en Supabase
  const manejarGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuarioAEditar) return;

    if (!editNombre.trim()) {
      setErrorEdicion("El nombre no puede estar vacío.");
      return;
    }
    if (!editEmail.trim() || !editEmail.includes("@")) {
      setErrorEdicion("El correo electrónico no es válido.");
      return;
    }

    setGuardando(true);
    setErrorEdicion("");

    try {
      const usuarioActualizado = await ServicioUsuariosAdmin.actualizarUsuario(
        usuarioAEditar.id,
        {
          nombre: editNombre,
          email: editEmail,
          rol: editRol,
          estado: editEstado,
          password: editPassword.trim() ? editPassword : undefined,
        }
      );

      setListaUsuarios((prev) =>
        prev.map((u) => (u.id === usuarioAEditar.id ? usuarioActualizado : u))
      );
      setUsuarioAEditar(null);

      toast.success("Usuario actualizado", {
        description: `Los datos de "${usuarioActualizado.nombre}" han sido guardados en Supabase.`,
      });
    } catch (error: any) {
      console.error("Error al actualizar usuario:", error);
      setErrorEdicion(error.message || "Error al actualizar en Supabase.");
    } finally {
      setGuardando(false);
    }
  };

  // Acciones: Eliminar Unitario en Supabase
  const confirmarEliminacion = async () => {
    if (!usuarioAEliminar) return;
    const nombreEliminado = usuarioAEliminar.nombre;
    const idEliminado = usuarioAEliminar.id;

    setGuardando(true);
    try {
      await ServicioUsuariosAdmin.eliminarUsuario(idEliminado);
      setListaUsuarios((prev) => prev.filter((u) => u.id !== idEliminado));
      setUsuarioAEliminar(null);
      toast.success("Usuario eliminado", {
        description: `Se eliminó a "${nombreEliminado}" de Supabase.`,
      });
    } catch (error: any) {
      console.error("Error al eliminar usuario:", error);
      toast.danger("Error al eliminar", {
        description: "No se pudo eliminar el usuario de Supabase.",
      });
    } finally {
      setGuardando(false);
    }
  };

  // Acciones: Eliminar Masivo en Supabase
  const confirmarEliminacionMasiva = async () => {
    if (idsSeleccionados.length === 0) return;
    const totalAfectados = idsSeleccionados.length;

    setGuardando(true);
    try {
      await ServicioUsuariosAdmin.eliminarUsuariosMasivo(idsSeleccionados);
      setListaUsuarios((prev) => prev.filter((u) => !idsSeleccionados.includes(u.id)));
      setSelectedKeys(new Set());
      setModalMasivoEliminar(false);
      toast.success("Usuarios eliminados", {
        description: `Se eliminaron ${totalAfectados} usuarios de Supabase correctamente.`,
      });
    } catch (error: any) {
      console.error("Error en eliminación masiva:", error);
      toast.danger("Error en eliminación masiva", {
        description: "Ocurrió un error al eliminar los usuarios en Supabase.",
      });
    } finally {
      setGuardando(false);
    }
  };

  // Formato de fecha legible
  const formatearFecha = (fechaStr: string) => {
    if (!fechaStr) return "-";
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-CO", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return fechaStr;
    }
  };

  // Estilos de badge según el rol
  const obtenerBadgeRol = (rol: RolAdmin) => {
    switch (rol) {
      case "Administrador":
      default:
        return {
          clase: "bg-[#0064c1]/10 text-[#0064c1] border-[#0064c1]/20",
          punto: "bg-[#0064c1]",
        };
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full relative">
      {/* Proveedor de Toasts de HeroUI */}
      <Toast.Provider placement="top" />

      {/* Barra de Filtros, Búsqueda, Refrescar y Botón Crear */}
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
              placeholder="Buscar por nombre, correo o rol..."
              className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
            />
            {busqueda && (
              <button
                type="button"
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

          {/* Filtro por Rol (Tabs) */}
          <div className="inline-flex p-1 rounded-full bg-black/[0.04] border border-black/[0.04]">
            {(["Todos", "Administrador"] as FiltroRol[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setFiltroRol(tab);
                  setPagina(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${filtroRol === tab
                  ? "bg-white text-[#0a0a0a] shadow-xs"
                  : "text-[#787774] hover:text-[#0a0a0a]"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Botón de Recarga / Sincronización */}
          <button
            type="button"
            onClick={recargarUsuarios}
            disabled={cargando}
            title="Sincronizar con Supabase"
            className="grid h-9 w-9 place-items-center rounded-full bg-white border border-black/10 text-[#787774] hover:text-[#0064c1] hover:border-[#0064c1]/40 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
          >
            <RefreshIcon size={16} className={cargando ? "animate-spin text-[#0064c1]" : ""} />
          </button>
        </div>

        {/* Acciones Masivas, Contador y Botón Crear */}
        <div className="flex items-center gap-3">
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

          {/* Botón Crear Usuario Administrativo */}
          <button
            type="button"
            onClick={() => {
              setErrorFormulario("");
              setModalCrearAbierto(true);
            }}
            className="group/btn relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm shrink-0"
            style={{
              backgroundImage:
                "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
              boxShadow:
                "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
            }}
          >
            <UserPlusIcon size={16} strokeWidth={2} className="relative z-10" />
            <span className="relative z-10">Crear administrativo</span>
          </button>
        </div>
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-hidden rounded-[28px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md">
        <Table>
          <Table.ScrollContainer className="custom-scrollbar">
            <Table.Content
              aria-label="Tabla de usuarios administrativos"
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
                    <span>Usuario</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "nombre" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Correo */}
                <Table.Column
                  onClick={() => manejarOrden("email")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Correo Electrónico</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "email" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Rol */}
                <Table.Column
                  onClick={() => manejarOrden("rol")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Rol</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "rol" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Fecha de Creación */}
                <Table.Column
                  onClick={() => manejarOrden("fecha_creacion")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Fecha de Creación</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "fecha_creacion" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Estado */}
                <Table.Column
                  onClick={() => manejarOrden("estado")}
                  className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#0064c1] cursor-pointer hover:bg-black/[0.03] select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Estado</span>
                    <span className="text-[0.65rem] text-[#787774]">
                      {columnaOrden === "estado" ? (direccionOrden === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </Table.Column>

                {/* Columna Acciones */}
                <Table.Column className="py-4 px-4 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-[#787774] text-right">
                  Acciones
                </Table.Column>
              </Table.Header>

              <Table.Body>
                {usuariosPaginados.length === 0 ? (
                  <Table.Row>
                    <Table.Cell className="py-12 text-center text-[#787774]" colSpan={7}>
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldUserIcon size={32} className="text-black/20" />
                        <span className="text-sm font-medium">No se encontraron usuarios administrativos</span>
                        <span className="text-xs text-[#787774]">
                          {cargando ? "Sincronizando con Supabase..." : "Intenta ajustar los términos de búsqueda o filtros"}
                        </span>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  usuariosPaginados.map((item) => {
                    const badgeRol = obtenerBadgeRol(item.rol);
                    const iniciales = (item.nombre || "AD").slice(0, 2).toUpperCase();

                    return (
                      <Table.Row
                        key={item.id}
                        className="border-t border-black/[0.04] transition-colors hover:bg-slate-50/60"
                      >
                        {/* Checkbox por fila */}
                        <Table.Cell className="py-3.5 px-4 w-10 pe-0">
                          <Checkbox aria-label={`Seleccionar ${item.nombre}`} slot="selection">
                            <Checkbox.Content>
                              <Checkbox.Control>
                                <Checkbox.Indicator />
                              </Checkbox.Control>
                            </Checkbox.Content>
                          </Checkbox>
                        </Table.Cell>

                        {/* Columna Usuario / Nombre */}
                        <Table.Cell className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl text-white text-xs font-bold shadow-xs"
                              style={{
                                backgroundImage:
                                  "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                              }}
                            >
                              {iniciales}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#0a0a0a] tracking-tight">
                                {item.nombre}
                              </span>
                              <span className="text-[0.68rem] text-[#787774] font-mono truncate max-w-[140px]" title={item.id}>
                                ID: {item.id.slice(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </Table.Cell>

                        {/* Columna Correo Electrónico */}
                        <Table.Cell className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 text-xs text-[#2f3437] font-medium">
                            <LetterIcon size={14} className="text-[#787774] shrink-0" />
                            <span className="truncate max-w-[200px]" title={item.email}>
                              {item.email}
                            </span>
                          </div>
                        </Table.Cell>

                        {/* Columna Rol */}
                        <Table.Cell className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badgeRol.clase}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${badgeRol.punto}`} />
                            {item.rol}
                          </span>
                        </Table.Cell>

                        {/* Columna Fecha de Creación */}
                        <Table.Cell className="py-3.5 px-4">
                          <div className="inline-flex items-center gap-1.5 text-xs text-[#2f3437] font-medium">
                            <CalendarMinimalisticIcon size={14} className="text-[#787774] shrink-0" />
                            <span>{formatearFecha(item.fecha_creacion)}</span>
                          </div>
                        </Table.Cell>

                        {/* Columna Estado */}
                        <Table.Cell className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.68rem] font-bold ${item.estado === "Activo"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-zinc-500/10 text-zinc-600"
                              }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${item.estado === "Activo" ? "bg-emerald-500" : "bg-zinc-400"
                                }`}
                            />
                            {item.estado}
                          </span>
                        </Table.Cell>

                        {/* Columna Acciones */}
                        <Table.Cell className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            {/* Botón Editar */}
                            <button
                              type="button"
                              onClick={() => abrirModalEditar(item)}
                              className="grid h-8 w-8 place-items-center rounded-xl text-[#787774] hover:text-[#0064c1] hover:bg-[#0064c1]/10 transition-colors cursor-pointer"
                              title="Editar usuario"
                              aria-label={`Editar ${item.nombre}`}
                            >
                              <Pen2Icon size={15} />
                            </button>

                            {/* Botón Eliminar */}
                            <button
                              type="button"
                              onClick={() => setUsuarioAEliminar(item)}
                              className="grid h-8 w-8 place-items-center rounded-xl text-[#787774] hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Eliminar usuario"
                              aria-label={`Eliminar ${item.nombre}`}
                            >
                              <TrashBinMinimalisticIcon size={15} />
                            </button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })
                )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>

        {/* Paginación y Resumen */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-t border-black/[0.06] bg-black/[0.01]">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold text-[#787774] font-mono">
              {inicioRango} a {finRango} de {totalRegistros} resultados
            </span>
            <span className="text-xs text-[#787774]">
              Seleccionados:{" "}
              <span className="font-semibold text-[#0a0a0a]">
                {selectedKeys === "all" ? "Todos" : totalSeleccionados > 0 ? totalSeleccionados : "Ninguno"}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {/* Botón Anterior */}
            <button
              type="button"
              disabled={pagina === 1}
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pagina === 1
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
                className={`grid h-8 w-8 place-items-center rounded-lg text-xs font-bold transition-all ${p === pagina
                  ? "bg-[#0064c1] text-white shadow-xs"
                  : "text-[#787774] hover:bg-black/[0.05] hover:text-[#0a0a0a] cursor-pointer"
                  }`}
              >
                {p}
              </button>
            ))}

            {/* Botón Siguiente */}
            <button
              type="button"
              disabled={pagina === totalPaginas}
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${pagina === totalPaginas
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

      {/* Modal de Creación de Usuario Administrativo renderizado en document.body */}
      {modalCrearAbierto && montado && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-rise"
            onClick={(e) => {
              if (e.target === e.currentTarget && !guardando) setModalCrearAbierto(false);
            }}
          >
            <div className="flex flex-col gap-5 max-w-md w-full p-6 sm:p-7 rounded-[28px] bg-white border border-black/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white shadow-xs"
                    style={{
                      backgroundImage:
                        "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                    }}
                  >
                    <ShieldUserIcon size={20} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="m-0 text-base font-bold text-[#0a0a0a]">Nuevo Usuario Administrativo</h3>
                    <span className="text-xs text-[#787774]">Se guardará directamente en Supabase</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setModalCrearAbierto(false)}
                  className="grid h-8 w-8 place-items-center rounded-full text-[#787774] hover:text-[#0a0a0a] hover:bg-black/[0.05] transition-colors cursor-pointer disabled:opacity-40"
                >
                  <CloseCircleIcon size={18} />
                </button>
              </div>

              {errorFormulario && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-700">
                  <DangerTriangleIcon size={16} className="shrink-0" />
                  <span>{errorFormulario}</span>
                </div>
              )}

              <form onSubmit={manejarCrearUsuario} className="flex flex-col gap-4">
                {/* Campo Nombre */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#0064c1]">
                    Nombre Completo
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#fbfbfa] focus-within:bg-white focus-within:border-[#0064c1] focus-within:ring-2 focus-within:ring-[#0064c1]/10 transition-all">
                    <UserIcon size={16} className="text-[#787774] shrink-0" />
                    <input
                      type="text"
                      required
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      placeholder="Ej. Carolina Morales"
                      className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
                    />
                  </div>
                </div>

                {/* Campo Correo Electrónico */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#0064c1]">
                    Correo Electrónico
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#fbfbfa] focus-within:bg-white focus-within:border-[#0064c1] focus-within:ring-2 focus-within:ring-[#0064c1]/10 transition-all">
                    <LetterIcon size={16} className="text-[#787774] shrink-0" />
                    <input
                      type="email"
                      required
                      value={nuevoEmail}
                      onChange={(e) => setNuevoEmail(e.target.value)}
                      placeholder="correo@observatorio.edu"
                      className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
                    />
                  </div>
                </div>

                {/* Campo Contraseña */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#0064c1]">
                    Contraseña
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#fbfbfa] focus-within:bg-white focus-within:border-[#0064c1] focus-within:ring-2 focus-within:ring-[#0064c1]/10 transition-all">
                    <LockPasswordIcon size={16} className="text-[#787774] shrink-0" />
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      required
                      value={nuevoPassword}
                      onChange={(e) => setNuevoPassword(e.target.value)}
                      placeholder="Contraseña segura"
                      className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="text-[#787774] hover:text-[#0a0a0a] cursor-pointer"
                      title={mostrarPassword ? "Ocultar contraseña" : "Ver contraseña"}
                    >
                      {mostrarPassword ? <EyeClosedIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                {/* Campo Rol */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#0064c1]">
                    Rol Asignado
                  </label>
                  <select
                    value={nuevoRol}
                    onChange={(e) => setNuevoRol(e.target.value as RolAdmin)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#fbfbfa] text-xs font-semibold text-[#0a0a0a] focus:bg-white focus:border-[#0064c1] focus:ring-2 focus:ring-[#0064c1]/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 mt-1 border-t border-black/[0.06]">
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => setModalCrearAbierto(false)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="relative inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm disabled:opacity-60"
                    style={{
                      backgroundImage:
                        "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                      boxShadow:
                        "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
                    }}
                  >
                    <UserPlusIcon size={15} strokeWidth={2} />
                    <span>{guardando ? "Guardando..." : "Guardar"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Edición de Usuario Administrativo renderizado en document.body */}
      {usuarioAEditar && montado && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-rise"
            onClick={(e) => {
              if (e.target === e.currentTarget && !guardando) setUsuarioAEditar(null);
            }}
          >
            <div className="flex flex-col gap-5 max-w-md w-full p-6 sm:p-7 rounded-[28px] bg-white border border-black/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.35)]">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <div className="flex items-center gap-3">
                  <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-white shadow-xs"
                    style={{
                      backgroundImage:
                        "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                    }}
                  >
                    <Pen2Icon size={18} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="m-0 text-base font-bold text-[#0a0a0a]">Editar Usuario Administrativo</h3>
                    <span className="text-xs text-[#787774]">Actualiza los datos en la base de datos</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setUsuarioAEditar(null)}
                  className="grid h-8 w-8 place-items-center rounded-full text-[#787774] hover:text-[#0a0a0a] hover:bg-black/[0.05] transition-colors cursor-pointer disabled:opacity-40"
                >
                  <CloseCircleIcon size={18} />
                </button>
              </div>

              {errorEdicion && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-700">
                  <DangerTriangleIcon size={16} className="shrink-0" />
                  <span>{errorEdicion}</span>
                </div>
              )}

              <form onSubmit={manejarGuardarEdicion} className="flex flex-col gap-4">
                {/* Campo Nombre */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#0064c1]">
                    Nombre Completo
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#fbfbfa] focus-within:bg-white focus-within:border-[#0064c1] focus-within:ring-2 focus-within:ring-[#0064c1]/10 transition-all">
                    <UserIcon size={16} className="text-[#787774] shrink-0" />
                    <input
                      type="text"
                      required
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
                    />
                  </div>
                </div>

                {/* Campo Correo Electrónico */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#0064c1]">
                    Correo Electrónico
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#fbfbfa] focus-within:bg-white focus-within:border-[#0064c1] focus-within:ring-2 focus-within:ring-[#0064c1]/10 transition-all">
                    <LetterIcon size={16} className="text-[#787774] shrink-0" />
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Campo Rol */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#0064c1]">
                      Rol
                    </label>
                    <select
                      value={editRol}
                      onChange={(e) => setEditRol(e.target.value as RolAdmin)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#fbfbfa] text-xs font-semibold text-[#0a0a0a] focus:bg-white focus:border-[#0064c1] focus:ring-2 focus:ring-[#0064c1]/10 outline-none transition-all cursor-pointer"
                    >
                      <option value="Administrador">Administrador</option>
                    </select>
                  </div>

                  {/* Campo Estado */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#0064c1]">
                      Estado
                    </label>
                    <select
                      value={editEstado}
                      onChange={(e) => setEditEstado(e.target.value as EstadoAdmin)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 bg-[#fbfbfa] text-xs font-semibold text-[#0a0a0a] focus:bg-white focus:border-[#0064c1] focus:ring-2 focus:ring-[#0064c1]/10 outline-none transition-all cursor-pointer"
                    >
                      <option value="Activo">Activo</option>
                      <option value="Inactivo">Inactivo</option>
                    </select>
                  </div>
                </div>

                {/* Campo Nueva Contraseña (Opcional) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-[0.08em] text-[#787774]">
                    Nueva Contraseña (Opcional)
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-black/10 bg-[#fbfbfa] focus-within:bg-white focus-within:border-[#0064c1] focus-within:ring-2 focus-within:ring-[#0064c1]/10 transition-all">
                    <LockPasswordIcon size={16} className="text-[#787774] shrink-0" />
                    <input
                      type={mostrarEditPassword ? "text" : "password"}
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Dejar en blanco para conservar actual"
                      className="bg-transparent border-none outline-none text-xs font-medium text-[#0a0a0a] placeholder:text-[#787774] w-full"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarEditPassword(!mostrarEditPassword)}
                      className="text-[#787774] hover:text-[#0a0a0a] cursor-pointer"
                    >
                      {mostrarEditPassword ? <EyeClosedIcon size={16} /> : <EyeIcon size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 mt-1 border-t border-black/[0.06]">
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => setUsuarioAEditar(null)}
                    className="px-4 py-2 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="relative inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-white text-xs font-semibold tracking-[-0.01em] cursor-pointer overflow-hidden transition-all duration-300 active:scale-[0.985] shadow-sm disabled:opacity-60"
                    style={{
                      backgroundImage:
                        "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                      boxShadow:
                        "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
                    }}
                  >
                    <Pen2Icon size={15} strokeWidth={2} />
                    <span>{guardando ? "Actualizando..." : "Actualizar usuario"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de Eliminación Unitaria renderizado en document.body */}
      {usuarioAEliminar && montado && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 animate-rise"
            onClick={(e) => {
              if (e.target === e.currentTarget && !guardando) setUsuarioAEliminar(null);
            }}
          >
            <div className="flex flex-col gap-4 max-w-sm w-full p-6 rounded-[28px] bg-white border border-black/[0.08] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.35)]">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600 font-bold">
                  <DangerTriangleIcon size={22} strokeWidth={2} />
                </span>
                <div className="flex flex-col min-w-0">
                  <h3 className="m-0 text-base font-bold text-[#0a0a0a]">¿Eliminar administrativo?</h3>
                  <span className="text-xs text-[#787774] truncate">
                    {usuarioAEliminar.nombre} ({usuarioAEliminar.email})
                  </span>
                </div>
              </div>

              <p className="m-0 text-xs text-[#2f3437] leading-relaxed">
                Esta acción removerá permanentemente al usuario y sus accesos de la base de datos de <strong>Supabase</strong>.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setUsuarioAEliminar(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={confirmarEliminacion}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {guardando ? "Eliminando..." : "Sí, eliminar de Supabase"}
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
              if (e.target === e.currentTarget && !guardando) setModalMasivoEliminar(false);
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
                    {totalSeleccionados} usuarios administrativos marcados
                  </span>
                </div>
              </div>

              <p className="m-0 text-xs text-[#2f3437] leading-relaxed">
                ¿Deseas eliminar permanentemente a los <strong>{totalSeleccionados} usuarios seleccionados</strong> de Supabase? Esta acción no se puede deshacer.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/[0.06]">
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() => setModalMasivoEliminar(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={confirmarEliminacionMasiva}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {guardando ? "Eliminando..." : "Sí, eliminar grupo"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default TablaUsuariosAdmin;
