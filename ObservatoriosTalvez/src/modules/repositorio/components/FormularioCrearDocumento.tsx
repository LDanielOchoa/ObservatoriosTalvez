"use client";

import React, { useState } from "react";
import { Toast, toast } from "@heroui/react";
import {
  AltArrowLeftIcon,
  ArrowRightIcon,
  BookBookmarkIcon,
  GlobeIcon,
  UsersGroupRoundedIcon,
  LinkRoundIcon,
  AddCircleIcon,
  CloseCircleIcon,
  NotesIcon,
} from "@solar-icons/react/outline";

export const FormularioCrearDocumento: React.FC = () => {
  const [titulo, setTitulo] = useState("");
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [lineaInvestigacion, setLineaInvestigacion] = useState("");
  const [tipoFuente, setTipoFuente] = useState("Artículo científico");
  const [pais, setPais] = useState("Colombia");
  const [categoria, setCategoria] = useState("");
  const [autorInput, setAutorInput] = useState("");
  const [autores, setAutores] = useState<string[]>([]);
  const [paginaWebInput, setPaginaWebInput] = useState("");
  const [paginasWeb, setPaginasWeb] = useState<string[]>([]);
  const [resumen, setResumen] = useState("");
  const [referenciaApa, setReferenciaApa] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Agregar autor a la lista
  const agregarAutor = () => {
    const limpio = autorInput.trim();
    if (limpio && !autores.includes(limpio)) {
      setAutores([...autores, limpio]);
      setAutorInput("");
    }
  };

  // Remover autor
  const removerAutor = (nombre: string) => {
    setAutores(autores.filter((a) => a !== nombre));
  };

  // Agregar página web
  const agregarPaginaWeb = () => {
    let limpio = paginaWebInput.trim();
    if (!limpio) return;
    
    // Auto-completar https:// si no lo incluye y parece un dominio
    if (!limpio.startsWith("http://") && !limpio.startsWith("https://")) {
      limpio = `https://${limpio}`;
    }

    if (!paginasWeb.includes(limpio)) {
      setPaginasWeb([...paginasWeb, limpio]);
      setPaginaWebInput("");
    }
  };

  // Remover página web
  const removerPaginaWeb = (url: string) => {
    setPaginasWeb(paginasWeb.filter((p) => p !== url));
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim() || !lineaInvestigacion.trim() || !ano.trim() || !pais.trim()) {
      toast.danger("Campos obligatorios", {
        description: "Por favor completa el título, línea de investigación, año y país.",
      });
      return;
    }

    setGuardando(true);

    try {
      const resp = await fetch("/api/repositorio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          ano: ano.trim(),
          lineaInvestigacion: lineaInvestigacion.trim(),
          tipoFuente: tipoFuente.trim(),
          pais: pais.trim(),
          categoria: categoria.trim() || null,
          autores,
          paginasWeb,
          enlaceDocumento: paginasWeb.length > 0 ? paginasWeb[0] : null,
          resumen: resumen.trim() || null,
          referenciaApa: referenciaApa.trim() || null,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo guardar el documento.");
      }

      toast.success("Documento registrado", {
        description: `"${titulo}" se ha agregado exitosamente al repositorio.`,
      });

      setTimeout(() => {
        window.location.href = "/dashboard/contenido-repositorio";
      }, 1000);
    } catch (err: any) {
      toast.danger("Error al registrar", {
        description: err.message || "Ocurrió un error inesperado al guardar.",
      });
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-8 max-w-6xl mx-auto">
      <Toast.Provider placement="top" />

      {/* Botón Volver */}
      <div className="flex items-center">
        <a
          href="/dashboard/contenido-repositorio"
          className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold text-[#0064c1] bg-white border border-[#0064c1]/20 hover:bg-[#0064c1] hover:text-white shadow-[0_2px_10px_-2px_rgba(0,100,193,0.14)] hover:shadow-[0_4px_16px_-2px_rgba(0,100,193,0.3)] transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <AltArrowLeftIcon
            size={16}
            strokeWidth={2.5}
            className="transition-transform duration-200 group-hover:-translate-x-1"
          />
          <span>Volver a Contenido Repositorios</span>
        </a>
      </div>

      {/* Encabezado Principal */}
      <header className="flex flex-col gap-2 pb-6 border-b border-black/[0.06]">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0064c1]">
          <span className="h-2 w-2 rounded-full bg-[#0064c1]"></span>
          Producción Científica
        </div>

        <h1 className="m-0 text-[clamp(1.8rem,3vw,2.4rem)] font-bold text-[#0a0a0a] tracking-[-0.03em] leading-tight mix-blend-multiply opacity-95">
          Registrar Nuevo Documento en Repositorio
        </h1>

        <p className="m-0 text-sm text-[#787774] font-medium tracking-tight">
          Agrega artículos, libros, informes o investigaciones al catálogo institucional del Observatorio.
        </p>
      </header>

      {/* Formulario y Vista Previa */}
      <form onSubmit={manejarSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formulario */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Sección 1: Información General */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.05]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0064c1]/10 text-[#0064c1] text-xs font-bold">
                1
              </span>
              <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                Datos Principales
              </span>
            </div>

            {/* Título */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
              Título del documento / investigación:
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Comportamiento de los estudios globales sobre migración..."
                className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                required
              />
            </label>

            {/* Línea de Investigación y Año */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                Línea de investigación:
                <input
                  type="text"
                  value={lineaInvestigacion}
                  onChange={(e) => setLineaInvestigacion(e.target.value)}
                  placeholder="Ej. Migración Latinoamericana, Educación..."
                  className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                Año de publicación:
                <input
                  type="text"
                  value={ano}
                  onChange={(e) => setAno(e.target.value)}
                  placeholder="Ej. 2026"
                  className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] font-mono"
                  required
                />
              </label>
            </div>

            {/* Tipo de Fuente y País */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                Tipo de fuente:
                <input
                  type="text"
                  value={tipoFuente}
                  onChange={(e) => setTipoFuente(e.target.value)}
                  placeholder="Ej. Artículo científico, Libro, Informe técnico..."
                  className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                  required
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                País:
                <input
                  type="text"
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                  placeholder="Ej. Colombia, México, Chile..."
                  className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                  required
                />
              </label>
            </div>

            {/* Categoría */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
              Categoría:
              <input
                type="text"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                placeholder="Ej. Migración y Fronteras, Derechos Humanos, Economía..."
                className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
              />
            </label>
          </div>

          {/* Sección 2: Autores */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.05]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0064c1]/10 text-[#0064c1] text-xs font-bold">
                2
              </span>
              <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                Autores / Investigadores
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={autorInput}
                  onChange={(e) => setAutorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      agregarAutor();
                    }
                  }}
                  placeholder="Nombre y apellidos del autor (presiona Enter)..."
                  className="flex-1 px-4 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                />
                <button
                  type="button"
                  onClick={agregarAutor}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0064c1] hover:bg-[#0052a3] transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <AddCircleIcon size={14} strokeWidth={2} />
                  <span>Añadir</span>
                </button>
              </div>

              {/* Chips de Autores */}
              <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.06]">
                {autores.length === 0 ? (
                  <span className="text-xs text-[#787774] italic">
                    No se han añadido autores aún. Escribe el nombre arriba y haz clic en Añadir.
                  </span>
                ) : (
                  autores.map((autor) => (
                    <span
                      key={autor}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-black/10 shadow-2xs text-xs font-medium text-[#0a0a0a]"
                    >
                      <UsersGroupRoundedIcon size={13} className="text-[#0064c1]" />
                      <span>{autor}</span>
                      <button
                        type="button"
                        onClick={() => removerAutor(autor)}
                        className="text-[#787774] hover:text-red-600 transition-colors cursor-pointer"
                        title="Eliminar autor"
                      >
                        <CloseCircleIcon size={13} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sección 3: Contenido, Páginas Web y Cita APA */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.05]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0064c1]/10 text-[#0064c1] text-xs font-bold">
                3
              </span>
              <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                Resumen, Páginas Web y Referencia APA
              </span>
            </div>

            {/* Resumen */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
              Resumen / Abstract del documento:
              <textarea
                rows={4}
                value={resumen}
                onChange={(e) => setResumen(e.target.value)}
                placeholder="Descripción concisa de la investigación, metodología y hallazgos principales..."
                className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] resize-none leading-relaxed"
              />
            </label>

            {/* Referencia APA */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
              Referencia bibliográfica en formato APA:
              <textarea
                rows={2}
                value={referenciaApa}
                onChange={(e) => setReferenciaApa(e.target.value)}
                placeholder="Ej. Sarango, A. F. H. (2026). Comportamiento de los estudios globales... Bitácora Urbano Territorial, 34(1)."
                className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] resize-none font-serif leading-relaxed"
              />
            </label>

            {/* Páginas Web Múltiples */}
            <div className="flex flex-col gap-2.5">
              <label className="text-xs font-semibold text-[#0a0a0a]">
                Páginas web / Enlaces del documento:
              </label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#787774]">
                    <GlobeIcon size={14} />
                  </span>
                  <input
                    type="text"
                    value={paginaWebInput}
                    onChange={(e) => setPaginaWebInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        agregarPaginaWeb();
                      }
                    }}
                    placeholder="https://... o dominio (presiona Enter)..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={agregarPaginaWeb}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#0064c1] hover:bg-[#0052a3] transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                >
                  <AddCircleIcon size={14} strokeWidth={2} />
                  <span>Añadir enlace</span>
                </button>
              </div>

              {/* Chips de Páginas Web */}
              <div className="flex flex-wrap gap-2 min-h-[36px] p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.06]">
                {paginasWeb.length === 0 ? (
                  <span className="text-xs text-[#787774] italic">
                    No has añadido páginas web. Puedes añadir varias ingresando la URL y haciendo clic en Añadir.
                  </span>
                ) : (
                  paginasWeb.map((paginaUrl) => (
                    <span
                      key={paginaUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-black/10 shadow-2xs text-xs font-medium text-[#0064c1] max-w-full font-mono"
                    >
                      <LinkRoundIcon size={13} className="shrink-0" />
                      <span className="truncate max-w-[280px]">{paginaUrl}</span>
                      <button
                        type="button"
                        onClick={() => removerPaginaWeb(paginaUrl)}
                        className="text-[#787774] hover:text-red-600 transition-colors cursor-pointer shrink-0 ml-1"
                        title="Eliminar enlace"
                      >
                        <CloseCircleIcon size={13} />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Botones de Guardado */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-black/[0.06]">
            <a
              href="/dashboard/contenido-repositorio"
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-[#787774] hover:bg-black/[0.05] transition-colors cursor-pointer"
            >
              Cancelar
            </a>

            <button
              type="submit"
              disabled={guardando}
              className={`group/btn relative inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full text-white text-xs font-semibold tracking-[-0.01em] transition-all duration-300 active:scale-[0.985] shadow-sm ${
                guardando ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
              }`}
              style={{
                backgroundImage:
                  "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                boxShadow:
                  "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
              }}
            >
              {guardando ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin relative z-10" />
                  <span className="relative z-10">Guardando documento...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Guardar en Repositorio</span>
                  <ArrowRightIcon
                    size={14}
                    strokeWidth={2}
                    className="relative z-10 transition-transform duration-300 group-hover/btn:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Columna Derecha: Vista Previa de la Ficha */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-6">
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0064c1]/10 text-[#0064c1] text-xs font-bold">
                ✓
              </span>
              <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                Previsualización de Tarjeta
              </span>
            </div>
          </div>

          {/* Tarjeta estilo CardDocumentoRepositorio */}
          <div className="relative flex flex-col justify-between rounded-[28px] p-6 bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md gap-4">
            <div className="flex flex-col gap-3">
              {/* Badges superiores */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-[#0064c1] bg-[#0064c1]/10 px-3 py-1 rounded-full">
                    <BookBookmarkIcon size={12} strokeWidth={2} />
                    {lineaInvestigacion || "Línea de investigación"}
                  </span>
                  {categoria && (
                    <span className="inline-flex items-center text-[0.68rem] font-bold text-[#787774] bg-black/[0.04] px-2.5 py-0.5 rounded-full">
                      {categoria}
                    </span>
                  )}
                </div>

                <span className="font-mono text-xs font-bold text-[#787774] bg-black/[0.04] px-2.5 py-0.5 rounded-full">
                  {ano || "2026"}
                </span>
              </div>

              {/* Título */}
              <h3 className="m-0 text-base font-bold text-[#0a0a0a] leading-snug tracking-tight line-clamp-3">
                {titulo || "Título del documento o investigación científica"}
              </h3>

              {/* Resumen */}
              <p className="m-0 text-xs text-[#787774] line-clamp-3 leading-relaxed">
                {resumen || "Aquí se mostrará el resumen estructurado de la publicación cuando lo ingreses en el formulario..."}
              </p>

              {/* Autores */}
              <div className="flex items-center gap-1.5 text-xs text-[#2f3437] font-medium pt-2 border-t border-black/[0.05]">
                <UsersGroupRoundedIcon size={14} className="text-[#0064c1] shrink-0" />
                <span className="truncate">
                  {autores.length > 0 ? autores.join(", ") : "Autores del documento"}
                </span>
              </div>

              {/* Páginas Web en Preview */}
              {paginasWeb.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-[#0064c1] font-mono pt-1">
                  <GlobeIcon size={13} className="shrink-0" />
                  <span className="truncate">
                    {paginasWeb.length} enlace{paginasWeb.length > 1 ? "s" : ""} web disponible{paginasWeb.length > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Footer de Tarjeta */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-black/[0.05] text-xs">
              <span className="inline-flex items-center gap-1 text-[#787774]">
                <GlobeIcon size={12} />
                {pais || "País"} • {tipoFuente}
              </span>

              <div className="inline-flex items-center gap-1 text-xs font-bold text-[#0064c1]">
                <span>Ver ficha</span>
                <ArrowRightIcon size={12} strokeWidth={2} />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default FormularioCrearDocumento;
