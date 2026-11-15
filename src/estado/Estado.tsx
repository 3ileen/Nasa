import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Contexto, type Estado, type Granularidad, type Paneles, type Tema } from "./contexto";
import { esCodigoIdioma, fijarIdioma, IDIOMAS, t, type CodigoIdioma } from "@/i18n";
import {
  aniosDisponibles,
  cargarCeldas,
  cargarHistorico,
  cargarRegion,
  cargarRegiones,
  mesesDelAnio,
  PERU,
  type CategoriaId,
  type CeldasAnio,
  type DatosRegion,
  type Historico,
  type Region,
} from "@/lib/historico";

const angosto = () => window.matchMedia("(max-width: 900px)").matches;
/** Up to 1180 px the three panels don't fit with the map: only one opens at a time. */
const COMPACTO = "(max-width: 1180px)";
const compacto = () => window.matchMedia(COMPACTO).matches;
/** Leaves only the given panel open (or none). */
const soloPanel = (p: keyof Paneles | null): Paneles => ({
  anios: p === "anios",
  resumen: p === "resumen",
  fechas: p === "fechas",
});

export function ProveedorEstado({ children }: { children: ReactNode }) {
  const [datosPeru, setDatos] = useState<Historico | null>(null);
  const [region, setRegion] = useState(PERU);
  const [regiones, setRegiones] = useState<Region[]>([]);
  const [datosRegion, setDatosRegion] = useState<DatosRegion | null>(null);
  /** With a region selected, its months and ranking replace Peru's (map and meta stay the same). */
  const datos = useMemo<Historico | null>(
    () =>
      datosPeru && region !== PERU && datosRegion
        ? { ...datosPeru, meses: datosRegion.meses, ranking: datosRegion.ranking }
        : datosPeru,
    [datosPeru, region, datosRegion],
  );
  const [error, setError] = useState<string | null>(null);
  const [celdasAnio, setCeldasAnio] = useState<CeldasAnio | null>(null);

  const [anio, setAnio] = useState(2024);
  const [gran, setGran] = useState<Granularidad>("anio");
  const [mes, setMes] = useState(9);
  const [activas, setActivas] = useState<CategoriaId[]>([]);
  const [paneles, setPaneles] = useState<Paneles>({ anios: true, resumen: true, fechas: true });
  const [escala, setEscala] = useState<0 | 1 | 2>(0);
  /** How Period and Summary were before highlighting (to restore them when the highlight is cleared). */
  const panelesAntes = useRef<Pick<Paneles, "anios" | "resumen"> | null>(null);

  // ---------- Language and theme (applied before rendering) ----------
  const [idioma, setIdioma] = useState<CodigoIdioma>("es");
  fijarIdioma(idioma);
  const [tema, setTema] = useState<Tema>("oscuro");
  // The map reads the colors in its effects, which run before ours.
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
    // Phone: the map is shown first. Tablet: only the matrix.
    if (compacto()) setPaneles(soloPanel(angosto() ? null : "fechas"));
    // When the window shrinks with several panels open, only one remains.
    const mq = window.matchMedia(COMPACTO);
    const alCambiar = () => {
      if (!mq.matches) return;
      setPaneles((s) => {
        const abiertos = (Object.keys(s) as (keyof Paneles)[]).filter((k) => s[k]);
        return abiertos.length > 1 ? soloPanel(s.fechas ? "fechas" : (abiertos[0] ?? null)) : s;
      });
    };
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("tema", tema);
    } catch {
      // No storage: it won't be remembered.
    }
  }, [tema]);
  useEffect(() => {
    document.documentElement.lang = IDIOMAS.find((i) => i.codigo === idioma)?.lang ?? "es";
    document.title = `NinaWillay · ${t.titulo}`;
    try {
      localStorage.setItem("idioma", idioma);
    } catch {
      // No storage: it won't be remembered.
    }
  }, [idioma]);

  // ---------- Data ----------
  useEffect(() => {
    cargarHistorico()
      .then((d) => {
        setDatos(d);
        const ultimo = aniosDisponibles(d.meses).at(-1) ?? 2024;
        setAnio(ultimo);
        setMes(d.ranking.find((r) => r.anio === ultimo)?.mes_pico ?? 9);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
    cargarRegiones()
      .then((r) => setRegiones(r.regiones))
      .catch(() => setRegiones([]));
  }, []);

  /** Switches region; if the selected year doesn't exist there (regions go up to 2024), jumps to the latest. */
  const elegirRegion = (id: string) => {
    if (id === PERU) {
      setRegion(PERU);
      setDatosRegion(null);
      return;
    }
    cargarRegion(id)
      .then((d) => {
        setDatosRegion(d);
        setRegion(id);
        const disponibles = aniosDisponibles(d.meses);
        setAnio((a) => (disponibles.includes(a) ? a : (disponibles.at(-1) ?? a)));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  };

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
   * When highlighting starts, Period and Summary collapse (they are unrelated to the highlighted
   * months and were confusing); when all highlighting is cleared they return to how they were.
   */
  const fijarResaltado = (nuevas: CategoriaId[]) => {
    if (activas.length === 0 && nuevas.length > 0) {
      panelesAntes.current = { anios: paneles.anios, resumen: paneles.resumen };
      setPaneles((p) => ({ ...p, anios: false, resumen: false }));
    } else if (activas.length > 0 && nuevas.length === 0 && panelesAntes.current) {
      const antes = panelesAntes.current;
      panelesAntes.current = null;
      setPaneles((p) => (compacto() ? p : { ...p, ...antes }));
    }
    setActivas(nuevas);
  };

  const valor: Estado = {
    cargando: !datos && !error,
    error,
    datos,
    anios,
    aniosCompletos,
    region,
    regiones,
    nombreRegion:
      region === PERU ? t.peru : (regiones.find((r) => r.id === region)?.nombre ?? region),
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
    elegirRegion,
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
      // Cell outside the highlight: the user moved on to something else, so the highlight is
      // cleared (Period and Summary return to how they were).
      if (!activas.includes(cat)) fijarResaltado([]);
      // Highlighted cell: Summary opens to show the selected month.
      else setPaneles((p) => ({ ...p, resumen: true }));
    },
    verAnioCompleto: () => setGran("anio"),
    limpiarCategorias: () => fijarResaltado([]),
    // Highlighting months in the matrix stops focusing on a single month: back to the full year.
    alternarCategoria: (c) => {
      fijarResaltado(activas.includes(c) ? activas.filter((x) => x !== c) : [...activas, c]);
      setGran("anio");
    },
    categoriaVisible: (c) => activas.length === 0 || activas.includes(c),
    alternarPanel: (p) =>
      setPaneles((s) => {
        // On compact screens, opening a panel closes the others (they don't stack).
        if (!s[p] && compacto()) return soloPanel(p);
        return { ...s, [p]: !s[p] };
      }),
    fijarEscala: setEscala,
    elegirIdioma: setIdioma,
    alternarTema: () => setTema((x) => (x === "oscuro" ? "claro" : "oscuro")),
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
