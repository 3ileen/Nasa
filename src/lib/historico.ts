// Harmonized MODIS + VIIRS historical data (2002–2026), per output/frontend_datos.md (schema 1.2).
// Key rule: null = no data (gap), 0 = real zero.

export const BASE_DATOS = "/data/historico/";
export const AMBITO = "peru"; // Cusco is left for a future improvement.

/**
 * "Compared to the usual" colors, different for each theme:
 * - Dark: cream → orange → red, with the record in hot pink so it doesn't get lost on black
 *   (color blindness ΔE ≥ 10.7 between all pairs).
 * - Light: a more saturated scale ending in a very dark maroon that stands out on white
 *   (the soft tones get a border).
 */
export const COLORES_CATEGORIA: Record<"oscuro" | "claro", Record<string, string>> = {
  oscuro: {
    muy_por_debajo: "#FFF7EA",
    por_debajo: "#FDC67A",
    normal: "#F7904A",
    por_encima: "#E2522A",
    muy_por_encima: "#B0221A",
    maximo: "#FF4FA3",
    sin_dato: "#6E7480",
  },
  claro: {
    muy_por_debajo: "#F6DDB8",
    por_debajo: "#F2B25E",
    normal: "#E9802F",
    por_encima: "#CC4A22",
    muy_por_encima: "#9A1F17",
    maximo: "#4A0A2C",
    sin_dato: "#9AA0A8",
  },
};

export type CategoriaId =
  | "muy_por_debajo"
  | "por_debajo"
  | "normal"
  | "por_encima"
  | "muy_por_encima"
  | "maximo"
  | "sin_dato";
export type Tramo = "estimado" | "viirs_real";

export type Categoria = { id: CategoriaId; etiqueta: string; color: string; orden: number };

export type Meta = {
  version: string;
  linea_base: [number, number];
  categorias: Categoria[];
  tramos: { id: Tramo; etiqueta: string; anios: [number, number | null] }[];
  factores: Record<
    "count" | "frp",
    Record<"alta" | "media" | "baja", { factor: number; ic_inf: number; ic_sup: number }>
  >;
  celdas_anios: number[];
  /** Near-real-time (NRT) data that may change. Empty `nrt_inicio` = none. */
  preliminar?: { etiqueta: string; descripcion: string; nrt_inicio: Record<string, string> };
};

/** Fields of a month compared to normal. */
type Anomalia = {
  tramo: Tramo;
  fuente: string;
  calidad: string;
  count: number | null;
  count_inf: number | null;
  count_sup: number | null;
  frp: number | null;
  mediana: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  maximo: number;
  anomalia: number | null;
  anomalia_pct: number | null;
  percentil: number | null;
  cat: CategoriaId;
  cat_inf: CategoriaId | null;
  cat_sup: CategoriaId | null;
  incierta: boolean | null;
};

export type Mes = Anomalia & {
  anio: number;
  mes: number; // 1–12
  temporada: "alta" | "media" | "baja";
  dias_sin_dato: number;
  /** Month with at least one day from the NRT product: may change; not shown as a record. */
  preliminar: boolean;
  dias_preliminar: number;
};

export type AnioRanking = {
  anio: number;
  tramo: Tramo;
  completo: boolean;
  preliminar: boolean;
  puesto: number | null;
  percentil: number | null;
  count: number;
  frp: number;
  anomalia_pct: number | null;
  mes_pico: number;
  count_mes_pico: number;
  pct_ago_sep: number;
};

/** Map cell: 0.25° (~28 km) up to 2011 and 0.1° (~11 km) from 2012. */
export type Celda = {
  id: string;
  lat: number;
  lon: number;
  tamano: number;
  /** Departments the pipeline assigns the cell to (approximate clipping; not used on the map). */
  ambitos?: string[];
};
export type CeldasAnio = {
  anio: number;
  /** Cell size for that year (0.25 or 0.1). */
  tamano_celda: number;
  tramo: Tramo;
  meses_con_dato: boolean[];
  preliminar_meses: (boolean | null)[];
  max_count: number;
  celdas: Record<string, { count: number; frp: number; meses: (number | null)[] }>;
};

export type Historico = {
  meta: Meta;
  meses: Mes[];
  ranking: AnioRanking[];
  celdas: Celda[];
};

const leer = async <T>(archivo: string): Promise<T> => {
  const r = await fetch(BASE_DATOS + archivo);
  if (!r.ok) throw new Error(`No se pudo leer ${archivo} (${r.status})`);
  return (await r.json()) as T;
};

export async function cargarHistorico(): Promise<Historico> {
  const [meta, cal, rank, idx] = await Promise.all([
    leer<Meta>("meta.json"),
    leer<{ meses: Mes[] }>(`calendar_${AMBITO}.json`),
    leer<{ anios: AnioRanking[] }>(`ranking_${AMBITO}.json`),
    leer<{ celdas: Celda[] }>("cells_index.json"),
  ]);
  return {
    meta,
    meses: cal.meses,
    ranking: rank.anios,
    celdas: idx.celdas,
  };
}

const cacheCeldas = new Map<number, Promise<CeldasAnio>>();
/** Map values for a year (lazy-loaded, once per year). */
export function cargarCeldas(anio: number): Promise<CeldasAnio> {
  let p = cacheCeldas.get(anio);
  if (!p) {
    p = leer<CeldasAnio>(`cells_${anio}.json`);
    p.catch(() => cacheCeldas.delete(anio));
    cacheCeldas.set(anio, p);
  }
  return p;
}

// ---------- Regions (departments) ----------

/** "peru" is the country; the rest are departments with their own calendar and ranking. */
export const PERU = "peru";
export type Region = { id: string; nombre: string };
export type DatosRegion = { meses: Mes[]; ranking: AnioRanking[] };

/** Pipeline id ("la_libertad") → map NOMBDEP ("LA LIBERTAD"). */
export const claveDepto = (id: string) => id.toUpperCase().replace(/_/g, " ");

export const cargarRegiones = () =>
  leer<{ hasta: number; regiones: Region[] }>("regiones/regiones.json");

const cacheRegiones = new Map<string, Promise<DatosRegion>>();
/** Calendar and ranking for a department (lazy-loaded, once per region). */
export function cargarRegion(id: string): Promise<DatosRegion> {
  let p = cacheRegiones.get(id);
  if (!p) {
    p = Promise.all([
      leer<{ meses: Mes[] }>(`regiones/calendar_${id}.json`),
      leer<{ anios: AnioRanking[] }>(`regiones/ranking_${id}.json`),
    ]).then(([c, r]) => ({ meses: c.meses, ranking: r.anios }));
    p.catch(() => cacheRegiones.delete(id));
    cacheRegiones.set(id, p);
  }
  return p;
}

// ---------- Grouping helpers ----------

/** The 12 months of a year (null where there is no row, e.g. Jan–Jun 2002). */
export function mesesDelAnio(meses: Mes[], anio: number): (Mes | null)[] {
  const out: (Mes | null)[] = Array.from({ length: 12 }, () => null);
  for (const m of meses) if (m.anio === anio) out[m.mes - 1] = m;
  return out;
}

export const aniosDisponibles = (meses: Mes[]) =>
  [...new Set(meses.map((m) => m.anio))].sort((a, b) => a - b);

/** A category is "above" if it is in the top three bands. */
export const SOBRE_NORMAL: CategoriaId[] = ["por_encima", "muy_por_encima", "maximo"];
export const BAJO_NORMAL: CategoriaId[] = ["por_debajo", "muy_por_debajo"];

export function resumenMeses(meses: (Mes | null)[]) {
  const validos = meses.filter((m): m is Mes => !!m);
  return {
    sobre: validos.filter((m) => SOBRE_NORMAL.includes(m.cat)).length,
    bajo: validos.filter((m) => BAJO_NORMAL.includes(m.cat)).length,
    inciertos: validos.filter((m) => m.incierta).length,
    frp: validos.reduce((s, m) => s + (m.frp ?? 0), 0),
  };
}

/**
 * Category of a complete year compared to the other years, using the same percentile cutoffs
 * the pipeline uses for months (p10, p25, p75, p90) and record for rank 1.
 * Incomplete years are not compared.
 */
export function categoriaAnio(
  r: Pick<AnioRanking, "completo" | "puesto" | "percentil">,
): CategoriaId {
  if (!r.completo || r.percentil === null) return "sin_dato";
  if (r.puesto === 1) return "maximo";
  if (r.percentil >= 90) return "muy_por_encima";
  if (r.percentil > 75) return "por_encima";
  if (r.percentil >= 25) return "normal";
  if (r.percentil >= 10) return "por_debajo";
  return "muy_por_debajo";
}

// ---------- Map: fixed sequential scale (not the traffic light; see the guide, section 8) ----------

/** Approximate area of a cell in km² (shrinks toward the poles). */
export const areaCeldaKm2 = (c: Pick<Celda, "tamano" | "lat">) =>
  (c.tamano * 111.32) ** 2 * Math.cos((c.lat * Math.PI) / 180);

/**
 * Density: hotspots per 100 km². This is what gets painted, because cells change size in 2012
 * (a 0.25° cell has 6.25 times the area of a 0.1° one), so all years compare the same way.
 */
export const densidad = (focos: number, c: Pick<Celda, "tamano" | "lat">) =>
  (100 * focos) / areaCeldaKm2(c);

/**
 * Fixed density cutoffs (hotspots per 100 km²), chosen from the real 2002–2025 distribution
 * (approx. percentiles 25, 45, 75 and 95), the same for large and small cells.
 */
export const CORTES_MAPA = { anio: [2, 5, 15, 50], mes: [1, 2.5, 5, 15] } as const;

export function claseMapa(valor: number, cortes: readonly number[]): number {
  if (!(valor > 0)) return -1;
  let i = 0;
  while (i < cortes.length && valor > (cortes[i] ?? Infinity)) i++;
  return i; // 0..cortes.length
}

// ---------- Download ----------

export function filasCsv(meses: (Mes | null)[]) {
  return meses
    .filter((m): m is Mes => !!m)
    .map((m) => ({
      anio: m.anio,
      mes: m.mes,
      temporada: m.temporada,
      tramo: m.tramo,
      fuente: m.fuente,
      calidad: m.calidad,
      focos: m.count,
      focos_min: m.count_inf,
      focos_max: m.count_sup,
      frp_mw: m.frp,
      mediana_normal: m.mediana,
      p25_normal: m.p25,
      p75_normal: m.p75,
      anomalia_pct: m.anomalia_pct,
      percentil: m.percentil,
      categoria: m.cat,
      incierta: m.incierta,
      preliminar: m.preliminar,
    }));
}
