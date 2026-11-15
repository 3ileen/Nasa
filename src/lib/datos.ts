import Papa from "papaparse";
import { claveDepartamento, nombreDepartamento } from "./departamentos";

/** Una detección (fila del CSV) ya procesada. */
export type Foco = {
  lat: number;
  lon: number;
  /** Fecha y hora originales del CSV (UTC). */
  fechaUtc: string;
  horaUtc: string;
  /** Fecha local de Perú (UTC−5). Es la que usa el calendario. */
  fecha: string;
  sensor: string;
  satelite: string;
  /** Focos "equivalentes VIIRS" que representa esta detección. */
  peso: number;
  frp: number;
  confianza: string;
  noche: boolean;
  /** Clave del departamento (mayúsculas, sin tildes). */
  departamento: string;
};

export type FilaCsv = Record<string, string | undefined>;

/** Suma de pesos y número de detecciones de un día. */
export type TotalDia = { peso: number; n: number };
export type IndiceDias = Map<string, TotalDia>;

export const FUERA_DE_PERU = "FUERA DE PERU";
const DESFASE_PERU_MS = 5 * 60 * 60 * 1000;

/** Fecha local de Perú (YYYY-MM-DD) a partir de la fecha y hora UTC. Puede ser el día anterior. */
export function fechaLocal(fecha: string, horaUtc: string): string {
  const [y, m, d] = fecha.split("-").map(Number);
  const [h, min] = (horaUtc || "00:00").split(":").map(Number);
  const t = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, h ?? 0, min ?? 0) - DESFASE_PERU_MS;
  return new Date(t).toISOString().slice(0, 10);
}

const numero = (s: string | undefined) => {
  const n = Number(String(s ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/** Reglas 1 y 2: descarta Fuera_De_Peru y calcula la fecha local. */
export function procesarFilas(filas: FilaCsv[]): Foco[] {
  const focos: Foco[] = [];
  for (const f of filas) {
    const departamento = claveDepartamento(f["departamento"] ?? "");
    const fechaUtc = (f["fecha"] ?? "").trim();
    if (!departamento || departamento === FUERA_DE_PERU || !fechaUtc) continue;
    const horaUtc = (f["hora_utc"] ?? "00:00").trim();
    focos.push({
      lat: numero(f["latitud"]),
      lon: numero(f["longitud"]),
      fechaUtc,
      horaUtc,
      fecha: fechaLocal(fechaUtc, horaUtc),
      sensor: (f["sensor"] ?? "").trim(),
      satelite: (f["satelite"] ?? "").trim(),
      peso: numero(f["peso"]) || 1,
      frp: numero(f["frp"]),
      confianza: (f["confianza"] ?? "").trim().toLowerCase(),
      noche: (f["dia_noche"] ?? "").trim().toLowerCase() === "noche",
      departamento,
    });
  }
  return focos;
}

export function leerCsv(texto: string): Foco[] {
  const r = Papa.parse<FilaCsv>(texto, { header: true, skipEmptyLines: true });
  return procesarFilas(r.data);
}

/** Manifiesto: año → lista de archivos CSV (focos_AAAA.csv o varias partes). */
export type Manifiesto = Record<number, string[]>;

export async function cargarManifiesto(): Promise<Manifiesto> {
  const res = await fetch("/data/anios.json");
  if (!res.ok) throw new Error(`No se pudo leer /data/anios.json (${res.status})`);
  const json = (await res.json()) as Record<string, string[]>;
  const out: Manifiesto = {};
  for (const [anio, archivos] of Object.entries(json)) out[Number(anio)] = archivos;
  return out;
}

export async function cargarAnio(archivos: string[]): Promise<Foco[]> {
  const partes = await Promise.all(
    archivos.map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`No se pudo leer ${url} (${res.status})`);
      return leerCsv(await res.text());
    }),
  );
  return partes.flat();
}

/** Regla 5: índice día local → suma de pesos y detecciones. */
export function indicePorDia(focos: Foco[]): IndiceDias {
  const indice: IndiceDias = new Map();
  for (const f of focos) {
    const t = indice.get(f.fecha);
    if (t) {
      t.peso += f.peso;
      t.n += 1;
    } else indice.set(f.fecha, { peso: f.peso, n: 1 });
  }
  return indice;
}

/** Total anual de focos equivalentes por departamento (para la lista de casillas). */
export function totalesPorDepartamento(focos: Foco[], anio: number): Record<string, number> {
  const out: Record<string, number> = {};
  const prefijo = `${anio}-`;
  for (const f of focos)
    if (f.fecha.startsWith(prefijo)) out[f.departamento] = (out[f.departamento] ?? 0) + f.peso;
  return out;
}

/** CSV de descarga: columnas originales + fecha_local. */
export function aCsv(focos: Foco[]): string {
  return Papa.unparse(
    focos.map((f) => ({
      latitud: f.lat,
      longitud: f.lon,
      fecha: f.fechaUtc,
      hora_utc: f.horaUtc,
      fecha_local: f.fecha,
      sensor: f.sensor,
      satelite: f.satelite,
      peso: f.peso,
      frp: f.frp,
      confianza: f.confianza,
      dia_noche: f.noche ? "noche" : "dia",
      departamento: nombreDepartamento(f.departamento),
    })),
  );
}
