"use client";

import React, { useState } from "react";
import { Toast, toast } from "@heroui/react";
import {
  LinkRoundIcon,
  CheckCircleIcon,
  AltArrowLeftIcon,
  ArrowRightIcon,
  NotesIcon,
  VideocameraIcon,
  GalleryIcon,
  ClockCircleIcon,
  StarsMinimalisticIcon,
  PlayIcon,
} from "@solar-icons/react/outline";
import type { ResultadoAnalisisUrl, TipoFeed } from "../services/contenido-feed.types";

export const FormularioCargarFeed: React.FC = () => {
  const [url, setUrl] = useState("");
  const [analizando, setAnalizando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [pasoAnalisis, setPasoAnalisis] = useState("");
  const [datosAnalizados, setDatosAnalizados] = useState<ResultadoAnalisisUrl | null>(null);

  // Campos editables del formulario
  const [tipo, setTipo] = useState<TipoFeed>("noticia");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imagen, setImagen] = useState("");
  const [fuenteOCanal, setFuenteOCanal] = useState("");
  const [categoria, setCategoria] = useState("Actualidad");
  const [duracionOLectura, setDuracionOLectura] = useState("");
  const [estado, setEstado] = useState<"Publicado" | "Borrador">("Publicado");

  // Función para analizar URL
  const analizarEnlace = async (urlAAnalizar: string) => {
    const enlaceLimpio = urlAAnalizar.trim();
    if (!enlaceLimpio) return;

    try {
      new URL(enlaceLimpio);
    } catch {
      toast.danger("URL inválida", {
        description: "Ingresa una dirección web válida comenzando por http:// o https://",
      });
      return;
    }

    setAnalizando(true);
    setPasoAnalisis("Conectando con el enlace...");
    setDatosAnalizados(null);

    try {
      setTimeout(() => setPasoAnalisis("Extrayendo etiquetas OpenGraph y oEmbed..."), 300);
      setTimeout(() => setPasoAnalisis("Generando previsualización HD de la portada..."), 650);

      const resp = await fetch(`/api/analizar-url?url=${encodeURIComponent(enlaceLimpio)}`);
      let resultado: ResultadoAnalisisUrl;

      if (resp.ok) {
        resultado = await resp.json();
      } else {
        const esYoutube =
          enlaceLimpio.includes("youtube.com") || enlaceLimpio.includes("youtu.be");
        const match = enlaceLimpio.match(
          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
        );
        const id = match ? match[1] : "";

        resultado = {
          tipo: esYoutube ? "youtube" : "noticia",
          enlace: enlaceLimpio,
          titulo: esYoutube ? "Video de YouTube" : "Artículo de Información",
          descripcion:
            "Contenido audiovisual y de actualidad vinculado al Observatorio.",
          imagen: id
            ? `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
            : "https://images.unsplash.com/photo-1588681664899-f142ff2dc9b1?auto=format&fit=crop&w=1200&q=80",
          fuenteOCanal: new URL(enlaceLimpio).hostname.replace(/^www\./, ""),
          categoria: esYoutube ? "Audiovisual" : "Actualidad",
          duracionOLectura: esYoutube ? "Video HD" : "4 min de lectura",
        };
      }

      setDatosAnalizados(resultado);
      setTipo(resultado.tipo);
      setTitulo(resultado.titulo);
      setDescripcion(resultado.descripcion);
      setImagen(resultado.imagen || "");
      setFuenteOCanal(resultado.fuenteOCanal || "");
      setCategoria(resultado.categoria || "Actualidad");
      setDuracionOLectura(resultado.duracionOLectura || (resultado.tipo === "youtube" ? "Video HD" : "4 min de lectura"));

      toast.success("Enlace analizado exitosamente", {
        description: `Se obtuvieron los metadatos de ${resultado.fuenteOCanal || "la web"}.`,
      });
    } catch {
      toast.danger("Error de análisis", {
        description: "No se pudieron obtener automáticamente los metadatos. Puedes completarlos en el formulario.",
      });
    } finally {
      setAnalizando(false);
      setPasoAnalisis("");
    }
  };

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !url.trim()) {
      toast.danger("Campos requeridos", {
        description: "Por favor ingresa la URL y el título del contenido.",
      });
      return;
    }

    setGuardando(true);

    try {
      const resp = await fetch("/api/contenido-feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tipo,
          enlace: url.trim(),
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          imagen: imagen.trim() || null,
          fuenteOCanal: fuenteOCanal.trim() || null,
          categoria: categoria.trim() || null,
          duracionOLectura: duracionOLectura.trim() || null,
          estado,
        }),
      });

      if (!resp.ok) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "No se pudo guardar el contenido.");
      }

      toast.success("Contenido publicado con éxito", {
        description: `"${titulo}" ha sido guardado y publicado en el feed.`,
      });

      setTimeout(() => {
        window.location.href = "/dashboard/contenido-feed";
      }, 1000);
    } catch (err: any) {
      toast.danger("Error al guardar", {
        description: err.message || "Ocurrió un error inesperado al guardar.",
      });
      setGuardando(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-8 max-w-6xl mx-auto">
      <Toast.Provider placement="top" />

      {/* Botón Volver */}
      <div>
        <a
          href="/dashboard/contenido-feed"
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-[#787774] hover:text-[#0064c1] transition-colors cursor-pointer"
        >
          <AltArrowLeftIcon
            size={16}
            strokeWidth={2}
            className="transition-transform duration-200 group-hover:-translate-x-1"
          />
          <span>Volver a Contenido Feed</span>
        </a>
      </div>

      {/* Encabezado Principal */}
      <header className="flex flex-col gap-2 pb-6 border-b border-black/[0.06]">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#0064c1]">
          <span className="h-2 w-2 rounded-full bg-[#0064c1]"></span>
          Carga Inteligente
        </div>

        <h1 className="m-0 text-[clamp(1.8rem,3vw,2.4rem)] font-bold text-[#0a0a0a] tracking-[-0.03em] leading-tight mix-blend-multiply opacity-95">
          Cargar Nuevo Enlace al Feed
        </h1>

        <p className="m-0 text-sm text-[#787774] font-medium tracking-tight">
          Ingresa el link de una noticia o video de YouTube. Nuestro motor extraerá automáticamente la portada, título, descripción y fuente para previsualizarlo al instante.
        </p>
      </header>

      {/* Caja de Análisis Inteligente de URL */}
      <div className="p-6 md:p-8 rounded-[32px] bg-white/95 border border-white/80 shadow-[0_20px_45px_-18px_rgba(9,60,120,0.14),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <label className="text-xs font-bold uppercase tracking-wider text-[#0064c1] flex items-center gap-2">
            <LinkRoundIcon size={16} strokeWidth={2} />
            URL de la Noticia o Video de YouTube
          </label>

          {datosAnalizados && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 animate-rise">
              <CheckCircleIcon size={14} strokeWidth={2} />
              Metadatos listos
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  analizarEnlace(url);
                }
              }}
              placeholder="Pega aquí la URL (ej: https://www.eltiempo.com/... o https://youtube.com/...)"
              className="w-full px-4 py-3 rounded-2xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] transition-all font-mono"
            />
          </div>

          <button
            type="button"
            disabled={analizando || !url.trim() || guardando}
            onClick={() => analizarEnlace(url)}
            className={`group/btn relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-xs font-semibold tracking-[-0.01em] transition-all duration-300 shadow-sm cursor-pointer whitespace-nowrap ${
              analizando || !url.trim() || guardando
                ? "bg-black/10 text-black/30 cursor-not-allowed"
                : "text-white active:scale-95"
            }`}
            style={
              !analizando && url.trim() && !guardando
                ? {
                    backgroundImage:
                      "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                    boxShadow:
                      "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
                  }
                : {}
            }
          >
            {analizando ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Analizando enlace...</span>
              </>
            ) : (
              <>
                <StarsMinimalisticIcon size={16} strokeWidth={2} />
                <span>Analizar metadatos</span>
              </>
            )}
          </button>
        </div>

        {/* Indicador de estado de escaneo */}
        {analizando && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0064c1] bg-[#0064c1]/[0.08] px-3.5 py-2 rounded-xl border border-[#0064c1]/15 animate-pulse">
            <span className="h-2 w-2 rounded-full bg-[#0064c1]" />
            <span>{pasoAnalisis || "Analizando el enlace..."}</span>
          </div>
        )}
      </div>

      {/* Contenedor Principal: Formulario y Vista Previa */}
      <form onSubmit={manejarSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Formulario */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Sección 1: Tipo y Enlace */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.05]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0064c1]/10 text-[#0064c1] text-xs font-bold">
                1
              </span>
              <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                Tipo y Clasificación
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setTipo("noticia")}
                className={`flex items-center justify-center gap-2.5 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  tipo === "noticia"
                    ? "bg-[#0064c1]/10 border-[#0064c1] text-[#0064c1] shadow-xs"
                    : "border-black/10 bg-black/[0.02] text-[#787774] hover:bg-black/[0.04]"
                }`}
              >
                <NotesIcon size={18} strokeWidth={2} />
                <span>Noticia / Artículo</span>
              </button>

              <button
                type="button"
                onClick={() => setTipo("youtube")}
                className={`flex items-center justify-center gap-2.5 py-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                  tipo === "youtube"
                    ? "bg-red-500/10 border-red-500 text-red-600 shadow-xs"
                    : "border-black/10 bg-black/[0.02] text-[#787774] hover:bg-black/[0.04]"
                }`}
              >
                <VideocameraIcon size={18} strokeWidth={2} />
                <span>Video de YouTube</span>
              </button>
            </div>
          </div>

          {/* Sección 2: Metadatos Principales */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.05]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0064c1]/10 text-[#0064c1] text-xs font-bold">
                2
              </span>
              <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                Detalles del Contenido
              </span>
            </div>

            {/* Título */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
              Título de la publicación:
              <input
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título extraído automáticamente..."
                className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                required
              />
            </label>

            {/* Descripción */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
              Descripción o resumen del contenido:
              <textarea
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Resumen o bajada de la publicación..."
                className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] resize-none leading-relaxed"
              />
            </label>

            {/* Grid Fuente / Categoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                Fuente o Canal:
                <input
                  type="text"
                  value={fuenteOCanal}
                  onChange={(e) => setFuenteOCanal(e.target.value)}
                  placeholder="Ej. El Tiempo / Canal Oficial"
                  className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                />
              </label>

              <label className="flex flex-col gap-1.5 font-semibold text-[#0a0a0a]">
                Categoría temática:
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  placeholder="Ej. Actualidad, Sostenibilidad..."
                  className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1]"
                />
              </label>
            </div>
          </div>

          {/* Sección 3: Multimedia & Estado */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="flex items-center gap-2 pb-2 border-b border-black/[0.05]">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0064c1]/10 text-[#0064c1] text-xs font-bold">
                3
              </span>
              <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                Multimedia y Publicación
              </span>
            </div>

            {/* URL Imagen */}
            <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#0a0a0a]">
              URL de imagen de portada / miniatura HD:
              <input
                type="url"
                value={imagen}
                onChange={(e) => setImagen(e.target.value)}
                placeholder="https://..."
                className="px-4 py-3 rounded-xl border border-black/10 bg-black/[0.02] text-xs font-medium text-[#0a0a0a] outline-none focus:border-[#0064c1] font-mono text-[0.75rem]"
              />
            </label>

            {/* Estado Selector */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-black/[0.02] border border-black/[0.06]">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-[#0a0a0a]">Estado del contenido</span>
                <span className="text-[0.72rem] text-[#787774]">
                  {estado === "Publicado"
                    ? "Se visualizará inmediatamente en el carrusel del Dashboard"
                    : "Permanecerá como borrador interno"}
                </span>
              </div>

              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as "Publicado" | "Borrador")}
                className="px-3.5 py-2 rounded-xl border border-black/10 bg-white text-xs font-bold text-[#0a0a0a] outline-none focus:border-[#0064c1] cursor-pointer"
              >
                <option value="Publicado">Publicado</option>
                <option value="Borrador">Borrador</option>
              </select>
            </div>
          </div>

          {/* Botones de Guardado */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-black/[0.06]">
            <a
              href="/dashboard/contenido-feed"
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
                  <span className="relative z-10">Guardando en base de datos...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">Guardar y publicar en Feed</span>
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

        {/* Columna Derecha: Vista Previa en Vivo */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-6">
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.05]">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0064c1]/10 text-[#0064c1] text-xs font-bold">
                ✓
              </span>
              <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider">
                Previsualización Contenido
              </span>
            </div>
          </div>

          {/* Tarjeta idéntica a CardNewsCarousel / CardYoutubeCarousel */}
          <div className="relative flex flex-col justify-between rounded-[32px] p-6 bg-white/95 border border-white/80 shadow-[0_24px_50px_-18px_rgba(9,60,120,0.18),0_1px_3px_rgba(0,0,0,0.03)] backdrop-blur-md overflow-hidden group/card">
            {/* Volumen 3D y Glow */}
            <div className="absolute inset-x-8 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-[#0064c1]/50 to-transparent pointer-events-none" />

            <div className="flex flex-col gap-4">
              {/* Header de la Card Preview */}
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <div className="flex items-center gap-2.5">
                  <span
                    className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-xs"
                    style={{
                      backgroundImage:
                        "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                      boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
                    }}
                  >
                    {tipo === "noticia" ? (
                      <NotesIcon size={18} strokeWidth={1.8} />
                    ) : (
                      <VideocameraIcon size={18} strokeWidth={1.8} />
                    )}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#0064c1]">
                      {tipo === "noticia" ? "Novedades" : "Para ver y aprender"}
                    </span>
                    <h4 className="m-0 text-sm font-bold text-[#0a0a0a] tracking-tight">
                      {tipo === "noticia" ? "News Feed" : "YouTube Feed"}
                    </h4>
                  </div>
                </div>

                <span className="font-mono text-[0.7rem] font-semibold text-[#787774] bg-black/[0.04] px-2.5 py-0.5 rounded-full">
                  01 / 01
                </span>
              </div>

              {/* Imagen con contenedor panorámico y zoom */}
              <div className="relative h-48 sm:h-52 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-black/10 group/img">
                {imagen ? (
                  <img
                    src={imagen}
                    alt={titulo || "Portada"}
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/img:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/40">
                    <GalleryIcon size={32} strokeWidth={1.5} />
                    <span className="text-xs font-medium">Ingresa un enlace para cargar foto</span>
                  </div>
                )}

                {/* Badge flotante de Fuente / Canal */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[0.7rem] font-bold shadow-xs">
                  {tipo === "noticia" ? (
                    <NotesIcon size={12} strokeWidth={2} />
                  ) : (
                    <PlayIcon size={12} strokeWidth={2} />
                  )}
                  <span>{fuenteOCanal || (tipo === "noticia" ? "Sitio Web" : "Canal YouTube")}</span>
                </div>

                {/* Badge de Categoría */}
                <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full bg-[#0064c1] text-white text-[0.65rem] font-bold shadow-xs">
                  {categoria || "Actualidad"}
                </div>

                {/* Si es video, overlay de play button */}
                {tipo === "youtube" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-red-600/90 text-white shadow-lg backdrop-blur-xs">
                      <PlayIcon size={20} strokeWidth={2} />
                    </div>
                  </div>
                )}
              </div>

              {/* Título y Descripción */}
              <div className="flex flex-col gap-1.5">
                <h3 className="m-0 text-base font-bold text-[#0a0a0a] tracking-tight line-clamp-2 leading-snug">
                  {titulo || "El título del artículo o video aparecerá en este espacio"}
                </h3>

                <p className="m-0 text-xs text-[#787774] font-medium line-clamp-3 leading-relaxed">
                  {descripcion || "La descripción y resumen extraídos se visualizarán de forma atractiva en esta sección de la tarjeta."}
                </p>
              </div>
            </div>

            {/* Footer de la Card con botón 3D idéntico al carrusel */}
            <div className="pt-4 border-t border-black/[0.06] flex items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-xs text-[#787774] font-medium">
                <ClockCircleIcon size={14} strokeWidth={1.8} className="text-[#0064c1]" />
                <span className="font-mono text-[0.72rem]">{duracionOLectura}</span>
              </div>

              <div
                className="group/btn relative inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-white text-xs font-semibold tracking-[-0.01em] shadow-sm pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(120% 80% at 50% 0%, #ffffff42, #ffffff0a 36%, #ffffff00 54%), linear-gradient(#66b2ff, #4fa3ff 56%, #4a9ffb)",
                  boxShadow:
                    "inset 0 1.5px 1px rgba(255,255,255,0.5), inset 0 9px 16px -10px rgba(255,255,255,0.3), inset 0 -14px 22px -10px rgba(26,106,202,0.5), 0 4px 12px -2px rgba(58,138,244,0.4)",
                }}
              >
                <span className="relative z-10">
                  {tipo === "noticia" ? "Leer noticia completa" : "Ver video en YouTube"}
                </span>
                <ArrowRightIcon size={12} strokeWidth={2} className="relative z-10" />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default FormularioCargarFeed;
