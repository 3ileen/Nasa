// Datos históricos armonizados MODIS + VIIRS (2002–2024), según output/frontend_datos.md (esquema 1.0).
// Regla clave: null = sin dato (hueco), 0 = cero real.

export const BASE_DATOS = "/data/historico/";
export const AMBITO = "peru"; // Cusco queda para una mejora futura.

/**
 * Colores "frente a lo usual", distintos para cada tema:
 * - Oscuro: crema → naranja → rojo, y récord en rosa intenso para que no se pierda en el negro
 *   (daltonismo ΔE ≥ 10,7 entre todos los pares).
 * - Claro: escala más saturada que termina en granate muy oscuro, que resalta sobre el blanco
 *   (los tonos suaves llevan borde).
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
};

/** Campos de un mes frente a lo normal. */
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
};

export type AnioRanking = {
  anio: number;
  tramo: Tramo;
  completo: boolean;
  puesto: number | null;
  percentil: number | null;
  count: number;
  frp: number;
  anomalia_pct: number | null;
  mes_pico: number;
  count_mes_pico: number;
  pct_ago_sep: number;
};

export type Celda = { id: string; lat: number; lon: number };
export type CeldasAnio = {
  anio: number;
  tramo: Tramo;
  meses_con_dato: boolean[];
  max_count: number;
  celdas: Record<string, { count: number; frp: number; meses: (number | null)[] }>;
};

export type Historico = {
  meta: Meta;
  meses: Mes[];
  ranking: AnioRanking[];
  celdas: Celda[];
  tamanoCelda: number;
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
    leer<{ tamano_celda: number; celdas: Celda[] }>("cells_index.json"),
  ]);
  return {
    meta,
    meses: cal.meses,
    ranking: rank.anios,
    celdas: idx.celdas,
    tamanoCelda: idx.tamano_celda,
  };
}

const cacheCeldas = new Map<number, Promise<CeldasAnio>>();
/** Valores del mapa de un año (carga perezosa, una vez por año). */
export function cargarCeldas(anio: number): Promise<CeldasAnio> {
  let p = cacheCeldas.get(anio);
  if (!p) {
    p = leer<CeldasAnio>(`cells_${anio}.json`);
    p.catch(() => cacheCeldas.delete(anio));
    cacheCeldas.set(anio, p);
  }
  return p;
}

// ---------- Ayudas de agrupación ----------

/** Los 12 meses de un año (null donde no hay fila, p. ej. ene–jun de 2002). */
export function mesesDelAnio(meses: Mes[], anio: number): (Mes | null)[] {
  const out: (Mes | null)[] = Array.from({ length: 12 }, () => null);
  for (const m of meses) if (m.anio === anio) out[m.mes - 1] = m;
  return out;
}

export const aniosDisponibles = (meses: Mes[]) =>
  [...new Set(meses.map((m) => m.anio))].sort((a, b) => a - b);

/** Una categoría es "por encima" si está en los tres tramos altos. */
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

// ---------- Mapa: escala secuencial fija (no el semáforo; ver la guía, sección 8) ----------

/** Cortes fijos para comparar años: anual y mensual por celda de 0,25°. */
export const CORTES_MAPA = { anio: [10, 50, 150, 400], mes: [3, 10, 30, 90] } as const;

export function claseMapa(valor: number, cortes: readonly number[]): number {
  if (!(valor > 0)) return -1;
  let i = 0;
  while (i < cortes.length && valor > (cortes[i] ?? Infinity)) i++;
  return i; // 0..cortes.length
}

// ---------- Descarga ----------

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
    }));
}
