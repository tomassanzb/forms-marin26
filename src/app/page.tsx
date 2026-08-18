"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  MapPin,
  Minus,
  Plus,
  Upload,
} from "lucide-react";

// ─── Compresión de imagen cliente ─────────────────────────────────────────────

async function comprimirImagen(file: File, maxPx = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(new File([blob!], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" })),
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ─── Configuración ────────────────────────────────────────────────────────────

const PRECIO_ENTRADA = 12000;
const ALIAS_PAGO = process.env.NEXT_PUBLIC_ALIAS_PAGO ?? "ALIAS.GRUPO.MISIONERO";
const MAPS_URL = "https://maps.app.goo.gl/XdfyYyUC42b3sLhH8";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Paso = "info" | "entradas" | "nombres" | "pago" | "exito";

interface Entrada {
  nombre: string;
  apellido: string;
}

// ─── Pantalla info ─────────────────────────────────────────────────────────────

function PantallaInfo({ onContinuar }: { onContinuar: () => void }) {
  return (
    <div className="step-content flex flex-col items-center text-center">
      {/* Badge fecha */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/80 backdrop-blur-sm">
        19 de septiembre · 20 hs
      </div>

      {/* Título */}
      <h1
        className="text-5xl font-bold text-white md:text-6xl"
        style={{ letterSpacing: "-0.03em", lineHeight: 1.0 }}
      >
        Peña
        <br />
        Folklórica
      </h1>

      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/50">
        Grupo Misionero San Juan Pablo II
      </p>

      {/* Logo misión */}
      <div className="my-7 flex items-center justify-center">
        <Image
          src="/logo.png"
          alt="Grupo Misionero San Juan Pablo II"
          width={200}
          height={200}
          className="opacity-90"
          style={{ objectFit: "contain", maxHeight: 180 }}
          priority
        />
      </div>

      <p className="max-w-xs text-base leading-7 text-white/70">
        Todos los fondos van a ayudar a la misión de verano. Unite y reservá tu
        entrada.
      </p>

      <button
        onClick={onContinuar}
        className="btn-primary mt-8 max-w-xs"
        style={{ background: "#faf6ee", color: "#0d1829" }}
      >
        Reservar entradas
      </button>
    </div>
  );
}

// ─── Pantalla éxito ────────────────────────────────────────────────────────────

function PantallaExito({ onReiniciar }: { onReiniciar: () => void }) {
  return (
    <div className="step-content flex flex-col items-center text-center text-white">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
        <Check size={26} className="text-[#d4aa4a]" />
      </div>

      <h2
        className="text-2xl font-bold"
        style={{ letterSpacing: "-0.02em" }}
      >
        ¡Todo listo!
      </h2>

      <p className="mt-3 max-w-xs text-base leading-7 text-white/65">
        Recibimos tu inscripción. Nos vemos el 19 de septiembre.
      </p>

      {/* Detalles del evento */}
      <div className="mt-6 w-full max-w-xs rounded-2xl border border-white/10 bg-white/7 px-4 py-4 text-left">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
          El evento
        </p>
        <p className="text-sm font-semibold text-white/90">
          19 de septiembre · 20 hs
        </p>
        <a
          href={MAPS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 flex items-center gap-2 hover:underline"
          style={{ color: "#d4aa4a" }}
        >
          <MapPin size={13} className="shrink-0" />
          <span className="text-sm">Av. del Libertador 17115, B1643 Beccar</span>
        </a>
      </div>

      <p className="mt-5 text-sm text-white/40">
        Si tenés dudas, hablá con tu misionero.
      </p>

      <button
        onClick={onReiniciar}
        className="mt-6 w-full max-w-xs rounded-xl py-3.5 text-sm font-semibold transition active:scale-[0.98]"
        style={{
          background: "rgba(255,255,255,0.12)",
          color: "white",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        Comprar otra entrada
      </button>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Home() {
  const [paso, setPaso] = useState<Paso>("info");
  const [misioneros, setMisioneros] = useState<string[]>([]);
  const [loadingMisioneros, setLoadingMisioneros] = useState(true);

  const [misionero, setMisionero] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);
  const [cantidad, setCantidad] = useState(1);
  const [entradas, setEntradas] = useState<Entrada[]>([{ nombre: "", apellido: "" }]);
  const [mismoNombre, setMismoNombre] = useState(false);
  const [nombreComun, setNombreComun] = useState("");
  const [apellidoComun, setApellidoComun] = useState("");
  const [asistencia, setAsistencia] = useState<"todos" | "algunos" | "ninguno">("todos");
  const [cantidadAsistentes, setCantidadAsistentes] = useState(1);
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [aliasCopied, setAliasCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const asistentesCount =
    asistencia === "todos" ? cantidad :
    asistencia === "ninguno" ? 0 :
    cantidadAsistentes;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setDropdownAbierto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetch("/api/misioneros")
      .then((r) => r.json())
      .then((d) => setMisioneros(d.misioneros ?? []))
      .catch(() => {})
      .finally(() => setLoadingMisioneros(false));
  }, []);

  const montoTotal = cantidad * PRECIO_ENTRADA;

  function cambiarCantidad(delta: number) {
    const n = Math.max(1, Math.min(30, cantidad + delta));
    setCantidad(n);
    setEntradas((prev) => {
      const next = [...prev];
      while (next.length < n) next.push({ nombre: "", apellido: "" });
      return next.slice(0, n);
    });
    if (asistencia === "algunos") {
      setCantidadAsistentes((prev) => Math.min(prev, n));
    }
  }

  function toggleMismoNombre() {
    setMismoNombre((v) => {
      if (!v) {
        setNombreComun("");
        setApellidoComun("");
      }
      return !v;
    });
  }

  function editarEntrada(i: number, campo: keyof Entrada, valor: string) {
    setEntradas((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [campo]: valor };
      return next;
    });
  }

  async function copiarAlias() {
    await navigator.clipboard.writeText(ALIAS_PAGO);
    setAliasCopied(true);
    setTimeout(() => setAliasCopied(false), 2000);
  }

  function manejarArchivo(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Subí una imagen (JPG, PNG) o un PDF del comprobante.");
      return;
    }
    setComprobante(file);
  }

  function continuarNombres() {
    if (mismoNombre) {
      const n = nombreComun.trim();
      const a = apellidoComun.trim();
      setEntradas(entradas.map(() => ({ nombre: n, apellido: a })));
    }
    setPaso("pago");
  }

  async function enviarFormulario() {
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("misionero", misionero);
      fd.append("entradas", JSON.stringify(entradas));
      fd.append("cantidad", String(cantidad));
      fd.append("monto_total", String(montoTotal));
      fd.append("asistentes", String(asistentesCount));
      if (comprobante) {
        const archivo = comprobante.type.startsWith("image/")
          ? await comprimirImagen(comprobante)
          : comprobante;
        fd.append("comprobante", archivo);
      }

      const res = await fetch("/api/registrar", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Error");
      if (!data.driveOk) {
        alert("Tu inscripción se guardó, pero no pudimos guardar la foto del comprobante. Mandásela directamente a tu misionero.");
      }
      setPaso("exito");
    } catch (e) {
      console.error(e);
      alert("Hubo un error al enviar. Revisá tu conexión y volvé a intentar.");
    } finally {
      setLoading(false);
    }
  }

  function reiniciar() {
    setMisionero("");
    setBusqueda("");
    setCantidad(1);
    setEntradas([{ nombre: "", apellido: "" }]);
    setMismoNombre(false);
    setNombreComun("");
    setApellidoComun("");
    setAsistencia("todos");
    setCantidadAsistentes(1);
    setComprobante(null);
    setPaso("entradas");
  }

  const puedeEntradas = !!misionero;
  const puedeNombres = mismoNombre
    ? !!(nombreComun.trim() && apellidoComun.trim())
    : entradas.every((e) => e.nombre.trim() && e.apellido.trim());
  const puedeEnviar = !!comprobante;

  const numeroPaso =
    paso === "entradas" ? 1 : paso === "nombres" ? 2 : paso === "pago" ? 3 : 0;

  const pasoAnterior: Record<string, Paso> = {
    entradas: "info",
    nombres: "entradas",
    pago: "nombres",
  };

  return (
    <main
      className="relative min-h-screen overflow-x-hidden"
      style={{
        background: "linear-gradient(160deg, #080f1c 0%, #0d1829 40%, #15244a 100%)",
      }}
    >
      {/* Textura sutil */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col justify-center px-5 py-12">

        {paso === "info" && (
          <PantallaInfo onContinuar={() => setPaso("entradas")} />
        )}

        {paso === "exito" && <PantallaExito onReiniciar={reiniciar} />}

        {(paso === "entradas" || paso === "nombres" || paso === "pago") && (
          <>
            {/* Mini header encima del card */}
            <div className="mb-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/40">
                Peña Folklórica · 19 sep
              </p>
            </div>

            <div className="card overflow-hidden">
              {/* Barra de progreso */}
              <div className="flex gap-1.5 px-6 pt-5">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-[3px] flex-1 rounded-full transition-all duration-400"
                    style={{
                      background: numeroPaso >= n ? "#b8922e" : "#e2d8c8",
                    }}
                  />
                ))}
              </div>

              <div className="p-6">

                {/* ── Paso 1: Cantidad y misionero ── */}
                {paso === "entradas" && (
                  <div key="entradas" className="step-content">
                    <h3
                      className="text-xl font-bold text-[#0d1829]"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      Tu reserva
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#6b7a94]">
                      Elegí cuántas entradas querés.
                    </p>

                    <div className="mt-6 space-y-5">
                      {/* Stepper cantidad */}
                      <div>
                        <label className="mb-2.5 block text-sm font-semibold text-[#0d1829]">
                          Cantidad de entradas
                        </label>
                        <div className="flex items-center gap-4 rounded-xl border border-[#ddd5c2] bg-white px-4 py-3">
                          <button
                            type="button"
                            onClick={() => cambiarCantidad(-1)}
                            disabled={cantidad <= 1}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0e9dc] text-[#0d1829] transition-all active:scale-90 disabled:opacity-30"
                          >
                            <Minus size={14} />
                          </button>

                          <span className="flex-1 text-center text-2xl font-bold text-[#0d1829]">
                            {cantidad}
                          </span>

                          <button
                            type="button"
                            onClick={() => cambiarCantidad(1)}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0e9dc] text-[#0d1829] transition-all active:scale-90"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Misionero */}
                      <div>
                        <label className="mb-2.5 block text-sm font-semibold text-[#0d1829]">
                          ¿Qué misionero te vendió las entradas?
                        </label>
                        <div ref={comboboxRef} className="relative">
                          <input
                            value={misionero || busqueda}
                            onChange={(e) => {
                              setBusqueda(e.target.value);
                              setMisionero("");
                              setDropdownAbierto(true);
                            }}
                            onFocus={() => setDropdownAbierto(true)}
                            placeholder={loadingMisioneros ? "Cargando..." : "Buscá tu misionero"}
                            disabled={loadingMisioneros}
                            className="form-input"
                            autoComplete="off"
                          />
                          {dropdownAbierto && !loadingMisioneros && (
                            <ul
                              className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-xl border border-[#ddd5c2] bg-white shadow-lg"
                            >
                              {misioneros
                                .filter((m) =>
                                  m.toLowerCase().includes((misionero || busqueda).toLowerCase())
                                )
                                .map((m) => (
                                  <li
                                    key={m}
                                    onMouseDown={() => {
                                      setMisionero(m);
                                      setBusqueda("");
                                      setDropdownAbierto(false);
                                    }}
                                    className="cursor-pointer px-4 py-2.5 text-sm text-[#0d1829] hover:bg-[#f0e9dc]"
                                  >
                                    {m}
                                  </li>
                                ))}
                              {misioneros.filter((m) =>
                                m.toLowerCase().includes((misionero || busqueda).toLowerCase())
                              ).length === 0 && (
                                <li className="px-4 py-3 text-sm text-[#a89f8e]">
                                  No encontramos ese misionero
                                </li>
                              )}
                            </ul>
                          )}
                        </div>
                      </div>

                      {/* Resumen */}
                      <div className="rounded-2xl bg-[#f0e9dc] px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#b8922e]">
                          Total a transferir
                        </p>
                        <p
                          className="mt-1 text-3xl font-bold text-[#0d1829]"
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          ${montoTotal.toLocaleString("es-AR")}
                        </p>
                        <p className="mt-0.5 text-xs text-[#6b7a94]">
                          {cantidad} {cantidad === 1 ? "entrada" : "entradas"} ×&nbsp;
                          ${PRECIO_ENTRADA.toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                      <button
                        onClick={() => setPaso("nombres")}
                        disabled={!puedeEntradas}
                        className="btn-primary"
                      >
                        Continuar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaso(pasoAnterior[paso])}
                        className="btn-ghost"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <ChevronLeft size={13} />
                          Volver
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Paso 2: Nombres ── */}
                {paso === "nombres" && (
                  <div key="nombres" className="step-content">
                    <h3
                      className="text-xl font-bold text-[#0d1829]"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      Datos de los asistentes
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#6b7a94]">
                      Completá los datos de cada persona.
                    </p>

                    {cantidad > 1 && (
                      <button
                        type="button"
                        onClick={toggleMismoNombre}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition active:scale-[0.98]"
                        style={{
                          background: mismoNombre ? "#b8922e" : "#f0e9dc",
                          color: mismoNombre ? "#fff" : "#6b5c3e",
                          border: mismoNombre ? "none" : "1px solid #ddd5c2",
                        }}
                      >
                        <Check size={14} style={{ opacity: mismoNombre ? 1 : 0.4 }} />
                        Usar el mismo nombre para todas
                      </button>
                    )}

                    <div className="mt-5 space-y-5">
                      {mismoNombre ? (
                        <div>
                          <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#b8922e]">
                            Poner entradas a nombre de:
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-[#0d1829]">
                                Nombre
                              </label>
                              <input
                                value={nombreComun}
                                onChange={(e) => setNombreComun(e.target.value)}
                                placeholder="María"
                                className="form-input"
                                autoFocus
                              />
                            </div>
                            <div>
                              <label className="mb-1.5 block text-sm font-medium text-[#0d1829]">
                                Apellido
                              </label>
                              <input
                                value={apellidoComun}
                                onChange={(e) => setApellidoComun(e.target.value)}
                                placeholder="García"
                                className="form-input"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        entradas.map((entrada, i) => (
                          <div key={i}>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#b8922e]">
                              Entrada {i + 1}
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="mb-1.5 block text-sm font-medium text-[#0d1829]">
                                  Nombre
                                </label>
                                <input
                                  value={entrada.nombre}
                                  onChange={(e) =>
                                    editarEntrada(i, "nombre", e.target.value)
                                  }
                                  placeholder={i === 0 ? "Sebastián" : i === 1 ? "Mía" : "Nombre"}
                                  className="form-input"
                                />
                              </div>
                              <div>
                                <label className="mb-1.5 block text-sm font-medium text-[#0d1829]">
                                  Apellido
                                </label>
                                <input
                                  value={entrada.apellido}
                                  onChange={(e) =>
                                    editarEntrada(i, "apellido", e.target.value)
                                  }
                                  placeholder={i === 0 ? "Wilder" : i === 1 ? "Dolan" : "Apellido"}
                                  className="form-input"
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                      <button
                        onClick={continuarNombres}
                        disabled={!puedeNombres}
                        className="btn-primary"
                      >
                        Continuar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaso(pasoAnterior[paso])}
                        className="btn-ghost"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <ChevronLeft size={13} />
                          Volver
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Paso 3: Pago ── */}
                {paso === "pago" && (
                  <div key="pago" className="step-content">
                    <h3
                      className="text-xl font-bold text-[#0d1829]"
                      style={{ letterSpacing: "-0.02em" }}
                    >
                      Transferencia
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[#6b7a94]">
                      Realizá la transferencia y subí el comprobante.
                    </p>

                    <div className="mt-5 space-y-4">
                      {/* Monto */}
                      <div className="rounded-2xl bg-[#f0e9dc] px-4 py-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#b8922e]">
                          Monto a transferir
                        </p>
                        <p
                          className="mt-1 text-3xl font-bold text-[#0d1829]"
                          style={{ letterSpacing: "-0.02em" }}
                        >
                          ${montoTotal.toLocaleString("es-AR")}
                        </p>
                        <p className="mt-0.5 text-xs text-[#6b7a94]">
                          {cantidad} {cantidad === 1 ? "entrada" : "entradas"} ×&nbsp;
                          ${PRECIO_ENTRADA.toLocaleString("es-AR")}
                        </p>
                      </div>

                      {/* Alias */}
                      <div>
                        <p className="mb-2 text-sm font-semibold text-[#0d1829]">
                          Alias
                        </p>
                        <button
                          type="button"
                          onClick={copiarAlias}
                          className="flex w-full items-center justify-between rounded-xl border border-[#ddd5c2] bg-white px-4 py-3 transition hover:bg-[#faf6ee] active:scale-[0.99]"
                        >
                          <span className="font-mono text-sm font-semibold text-[#0d1829]">
                            {ALIAS_PAGO}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-[#6b7a94]">
                            {aliasCopied ? (
                              <>
                                <Check size={13} className="text-[#b8922e]" />
                                <span className="text-[#b8922e]">Copiado</span>
                              </>
                            ) : (
                              <>
                                <Copy size={13} />
                                Copiar
                              </>
                            )}
                          </span>
                        </button>
                      </div>

                      {/* Asistencia */}
                      <div>
                        <p className="mb-2 text-sm font-semibold text-[#0d1829]">
                          ¿Cuántos van a venir a la peña?
                        </p>
                        <div className="flex rounded-xl border border-[#ddd5c2] bg-[#f0e9dc] p-1">
                          {(["todos", "algunos", "ninguno"] as const).map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                setAsistencia(opt);
                                if (opt === "algunos") setCantidadAsistentes(Math.max(1, Math.min(cantidad - 1, 1)));
                              }}
                              className="flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition active:scale-[0.97]"
                              style={{
                                background: asistencia === opt ? "white" : "transparent",
                                color: asistencia === opt ? "#0d1829" : "#a89f8e",
                                boxShadow: asistencia === opt ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                              }}
                            >
                              {opt === "todos" ? "Todos" : opt === "algunos" ? "Algunos" : "Ninguno"}
                            </button>
                          ))}
                        </div>

                        {asistencia === "algunos" && (
                          <div className="mt-3 flex items-center gap-4 rounded-xl border border-[#ddd5c2] bg-white px-4 py-3">
                            <button
                              type="button"
                              onClick={() => setCantidadAsistentes((p) => Math.max(1, p - 1))}
                              disabled={cantidadAsistentes <= 1}
                              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0e9dc] text-[#0d1829] transition-all active:scale-90 disabled:opacity-30"
                            >
                              <Minus size={14} />
                            </button>
                            <div className="flex flex-1 flex-col items-center">
                              <span className="text-2xl font-bold text-[#0d1829]">
                                {cantidadAsistentes}
                              </span>
                              <span className="text-[10px] text-[#a89f8e]">
                                de {cantidad} {cantidad === 1 ? "entrada" : "entradas"}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCantidadAsistentes((p) => Math.min(cantidad, p + 1))}
                              disabled={cantidadAsistentes >= cantidad}
                              className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0e9dc] text-[#0d1829] transition-all active:scale-90 disabled:opacity-30"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Upload */}
                      <div>
                        <p className="mb-2 text-sm font-semibold text-[#0d1829]">
                          Comprobante de transferencia
                        </p>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          aria-hidden="true"
                          tabIndex={-1}
                          onChange={(e) =>
                            manejarArchivo(e.target.files?.[0] ?? null)
                          }
                        />

                        {comprobante ? (
                          <div className="flex items-center justify-between rounded-xl border border-[#ddd5c2] bg-white px-4 py-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[#0d1829]">
                                {comprobante.name}
                              </p>
                              <p className="text-xs text-[#6b7a94]">
                                {(comprobante.size / 1024).toFixed(0)} KB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setComprobante(null);
                                if (fileRef.current) fileRef.current.value = "";
                              }}
                              className="ml-3 shrink-0 text-xs text-[#6b7a94] transition hover:text-[#0d1829]"
                            >
                              Cambiar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setDragOver(true);
                            }}
                            onDragLeave={() => setDragOver(false)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOver(false);
                              manejarArchivo(e.dataTransfer.files[0] ?? null);
                            }}
                            className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed py-8 transition"
                            style={{
                              borderColor: dragOver ? "#b8922e" : "#ddd5c2",
                              background: dragOver ? "#faf6ee" : "white",
                            }}
                          >
                            <Upload
                              size={18}
                              className={dragOver ? "text-[#b8922e]" : "text-[#a89f8e]"}
                            />
                            <span className="text-sm text-[#6b7a94]">
                              Subir imagen o PDF
                            </span>
                            <span className="text-xs text-[#a89f8e]">
                              o arrastrá el archivo acá
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-2">
                      <button
                        onClick={enviarFormulario}
                        disabled={!puedeEnviar || loading}
                        className="btn-primary"
                      >
                        {loading ? "Enviando..." : "Enviar inscripción"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaso(pasoAnterior[paso])}
                        className="btn-ghost"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <ChevronLeft size={13} />
                          Volver
                        </span>
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </>
        )}

      </section>
    </main>
  );
}
