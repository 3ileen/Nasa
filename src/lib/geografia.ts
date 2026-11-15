// Reference geography for the map: department names, Peru's border,
// label positions and which department each cell belongs to.
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from "geojson";

export type Limites = FeatureCollection<Polygon | MultiPolygon, { NOMBDEP: string }>;
type Depto = Feature<Polygon | MultiPolygon, { NOMBDEP: string }>;

/** NOMBDEP (uppercase, no accents) → display name. */
const NOMBRES: Record<string, string> = {
  AMAZONAS: "Amazonas",
  ANCASH: "Áncash",
  APURIMAC: "Apurímac",
  AREQUIPA: "Arequipa",
  AYACUCHO: "Ayacucho",
  CAJAMARCA: "Cajamarca",
  CALLAO: "Callao",
  CUSCO: "Cusco",
  HUANCAVELICA: "Huancavelica",
  HUANUCO: "Huánuco",
  ICA: "Ica",
  JUNIN: "Junín",
  "LA LIBERTAD": "La Libertad",
  LAMBAYEQUE: "Lambayeque",
  LIMA: "Lima",
  LORETO: "Loreto",
  "MADRE DE DIOS": "Madre de Dios",
  MOQUEGUA: "Moquegua",
  PASCO: "Pasco",
  PIURA: "Piura",
  PUNO: "Puno",
  "SAN MARTIN": "San Martín",
  TACNA: "Tacna",
  TUMBES: "Tumbes",
  UCAYALI: "Ucayali",
};
export const nombreDepartamento = (clave: string) => NOMBRES[clave] ?? clave;

const anillos = (d: Depto): Position[][] =>
  d.geometry.type === "Polygon" ? d.geometry.coordinates : d.geometry.coordinates.flat();

/**
 * Peru's outer border: the segments that belong to a single department
 * (internal segments are shared by two neighboring departments).
 * Returns [lat, lon] segments ready for Leaflet.
 */
export function fronteraExterior(limites: Limites): [number, number][][] {
  const clave = (a: Position, b: Position) => {
    const p = `${(a[0] ?? 0).toFixed(6)},${(a[1] ?? 0).toFixed(6)}`;
    const q = `${(b[0] ?? 0).toFixed(6)},${(b[1] ?? 0).toFixed(6)}`;
    return p < q ? `${p}|${q}` : `${q}|${p}`;
  };
  const cuenta = new Map<string, number>();
  const tramos: [Position, Position, string][] = [];
  for (const d of limites.features)
    for (const anillo of anillos(d))
      for (let i = 1; i < anillo.length; i++) {
        const a = anillo[i - 1]!;
        const b = anillo[i]!;
        const k = clave(a, b);
        cuenta.set(k, (cuenta.get(k) ?? 0) + 1);
        tramos.push([a, b, k]);
      }
  return tramos
    .filter(([, , k]) => cuenta.get(k) === 1)
    .map(([a, b]) => [
      [a[1] ?? 0, a[0] ?? 0],
      [b[1] ?? 0, b[0] ?? 0],
    ]);
}

/** A point inside the department for its label (near the center of the largest ring). */
export function puntoEtiqueta(d: Depto): [number, number] {
  const anillo = anillos(d).reduce((a, b) => (b.length > a.length ? b : a), [] as Position[]);
  const xs = anillo.map((p) => p[0] ?? 0);
  const ys = anillo.map((p) => p[1] ?? 0);
  const prom: [number, number] = [
    xs.reduce((s, x) => s + x, 0) / xs.length,
    ys.reduce((s, y) => s + y, 0) / ys.length,
  ];
  if (booleanPointInPolygon(point(prom), d)) return [prom[1], prom[0]];
  // If the average falls outside (concave shapes), find the closest interior point on a grid.
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  let mejor: [number, number] | null = null;
  let dist = Infinity;
  for (let i = 1; i < 20; i++)
    for (let j = 1; j < 20; j++) {
      const x = x0 + ((x1 - x0) * i) / 20;
      const y = y0 + ((y1 - y0) * j) / 20;
      if (!booleanPointInPolygon(point([x, y]), d)) continue;
      const dd = (x - prom[0]) ** 2 + (y - prom[1]) ** 2;
      if (dd < dist) {
        dist = dd;
        mejor = [y, x];
      }
    }
  return mejor ?? [prom[1], prom[0]];
}

/** Department containing the center of each cell (id → NOMBDEP). */
export function departamentoDeCeldas(
  limites: Limites,
  celdas: { id: string; lat: number; lon: number }[],
): Map<string, string> {
  const out = new Map<string, string>();
  for (const c of celdas) {
    const p = point([c.lon, c.lat]);
    const d = limites.features.find((f) => booleanPointInPolygon(p, f));
    if (d) out.set(c.id, d.properties.NOMBDEP);
  }
  return out;
}
