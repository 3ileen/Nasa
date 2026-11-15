import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Contexto, type Estado, type Granularidad, type Paneles, type Tema } from "./contexto";
import { esCodigoIdioma, fijarIdioma, IDIOMAS, t, type CodigoIdioma } from "@/i18n";
import {
  aniosDisponibles,
  cargarCeldas,
  cargarHistorico,
  mesesDelAnio,
  type CategoriaId,
  type CeldasAnio,
  type Historico,
} from "@/lib/historico";

const angosto = () => window.matchMedia("(max-width: 900px)").matches;

export function ProveedorEstado({ children }: { children: ReactNode }) {
  const [datos, setDatos] = useState<Historico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [celdasAnio, setCeldasAnio] = useState<CeldasAnio | null>(null);

  const [anio, setAnio] = useState(2024);
  const [gran, setGran] = useState<Granularidad>("anio");
  const [mes, setMes] = useState(9);
  const [activas, setActivas] = useState<CategoriaId[]>([]);
  const [paneles, setPaneles] = useState<Paneles>({ anios: true, resumen: true, fechas: true });
  const [escala, setEscala] = useState<0 | 1 | 2>(0);
  /** Cómo estaban Periodo y Resumen antes de resaltar (para dejarlos igual al quitar el resaltado). */
  const panelesAntes = useRef<Pick<Paneles, "anios" | "resumen"> | null>(null);

  // ---------- Idioma y tema (se aplican antes de renderizar) ----------
  const [idioma, setIdioma] = useState<CodigoIdioma>("es");
  fijarIdioma(idioma);
  const [tema, setTema] = useState<Tema>("oscuro");
  // El mapa lee los colores en sus efectos, que corren antes que los nuestros.
  if (typeof document !== "undefined") document.documentElement.dataset["tema"] = tema;

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    const temaUrl = url.get("tema");
    const idiomaUrl = url.get("lang");
    try {
      const t2 = temaUrl ?? localStorage.getItem("tema");
      if (t2 === "claro" || t2 === "oscuro") setTema(t2);
      const i2 = idiomaUrl ?? localStorage.getItem("idioma");
      if (esCodigoIdioma(i2)) setIdioma(i2);
    } catch {
      if (temaUrl === "claro" || temaUrl === "oscuro") setTema(temaUrl);
      if (esCodigoIdioma(idiomaUrl)) setIdioma(idiomaUrl);
    }
    if (angosto()) setPaneles({ anios: false, resumen: true, fechas: false });
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("tema", tema);
    } catch {
      // Sin almacenamiento: no se recordará.
    }
  }, [tema]);
  useEffect(() => {
    document.documentElement.lang = IDIOMAS.find((i) => i.codigo === idioma)?.lang ?? "es";
    document.title = `NinaWillay · ${t.titulo}`;
    try {
      localStorage.setItem("idioma", idioma);
    } catch {
      // Sin almacenamiento: no se recordará.
    }
  }, [idioma]);

  // ---------- Datos ----------
  useEffect(() => {
    cargarHistorico()
      .then((d) => {
        setDatos(d);
        const ultimo = aniosDisponibles(d.meses).at(-1) ?? 2024;
        setAnio(ultimo);
        setMes(d.ranking.find((r) => r.anio === ultimo)?.mes_pico ?? 9);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    let vigente = true;
    setCeldasAnio(null);
    cargarCeldas(anio)
      .then((c) => vigente && setCeldasAnio(c))
      .catch(() => vigente && setCeldasAnio(null));
    return () => {
      vigente = false;
    };
  }, [anio]);

  const anios = useMemo(() => (datos ? aniosDisponibles(datos.meses) : []), [datos]);
  const aniosCompletos = useMemo(
    () => datos?.ranking.filter((r) => r.puesto !== null).length ?? 0,
    [datos],
  );
  const mesesAnio = useMemo(() => (datos ? mesesDelAnio(datos.meses, anio) : []), [datos, anio]);
  const mesSel = mesesAnio[mes - 1] ?? null;
  const rankingAnio = datos?.ranking.find((r) => r.anio === anio) ?? null;
  const etiquetaPeriodo = gran === "anio" ? String(anio) : t.mesAnio(mes - 1, anio);

  /**
   * Al empezar a resaltar se contraen Periodo y Resumen (no tienen relación con los meses
   * resaltados y confundían); al quitar todo el resaltado vuelven a como estaban.
   */
  const fijarResaltado = (nuevas: CategoriaId[]) => {
    if (activas.length === 0 && nuevas.length > 0) {
      panelesAntes.current = { anios: paneles.anios, resumen: paneles.resumen };
      setPaneles((p) => ({ ...p, anios: false, resumen: false }));
    } else if (activas.length > 0 && nuevas.length === 0 && panelesAntes.current) {
      const antes = panelesAntes.current;
      panelesAntes.current = null;
      setPaneles((p) => ({ ...p, ...antes }));
    }
    setActivas(nuevas);
  };

  const valor: Estado = {
    cargando: !datos && !error,
    error,
    datos,
    anios,
    aniosCompletos,
    anio,
    gran,
    mes,
    activas,
    paneles,
    escala,
    idioma,
    tema,
    mesesAnio,
    mesSel,
    rankingAnio,
    etiquetaPeriodo,
    celdasAnio,
    elegirAnio: setAnio,
    elegirGran: setGran,
    elegirMes: (m) => {
      setMes(m);
      setGran("mes");
    },
    elegirPeriodo: (a, m) => {
      setAnio(a);
      setMes(m);
      setGran("mes");
      if (activas.length === 0) return;
      const fila = datos?.meses.find((x) => x.anio === a && x.mes === m);
      const cat: CategoriaId = !fila || fila.count === null ? "sin_dato" : fila.cat;
      // Casilla fuera de lo resaltado: el usuario cambió de tema, se limpia el resaltado
      // (Periodo y Resumen vuelven a como estaban).
      if (!activas.includes(cat)) fijarResaltado([]);
      // Casilla resaltada: se abre el Resumen para ver el mes elegido.
      else setPaneles((p) => ({ ...p, resumen: true }));
    },
    verAnioCompleto: () => setGran("anio"),
    limpiarCategorias: () => fijarResaltado([]),
    // Resaltar meses en la matriz deja de mirar un mes concreto: vuelve al año completo.
    alternarCategoria: (c) => {
      fijarResaltado(activas.includes(c) ? activas.filter((x) => x !== c) : [...activas, c]);
      setGran("anio");
    },
    categoriaVisible: (c) => activas.length === 0 || activas.includes(c),
    alternarPanel: (p) =>
      setPaneles((s) => {
        const sig = { ...s, [p]: !s[p] };
        // En pantallas angostas, solo un panel lateral abierto a la vez.
        if (sig[p] && p !== "resumen" && angosto()) sig[p === "anios" ? "fechas" : "anios"] = false;
        return sig;
      }),
    fijarEscala: setEscala,
    elegirIdioma: setIdioma,
    alternarTema: () => setTema((x) => (x === "oscuro" ? "claro" : "oscuro")),
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
