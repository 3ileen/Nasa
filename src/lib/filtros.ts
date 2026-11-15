import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import type { Polygon } from "geojson";
import type { Foco, IndiceDias } from "./datos";
import { nivelDe, type Limites, type Nivel } from "./niveles";
import { dentro, type Periodo } from "./periodos";

export type Area = {
  modo: "departamentos" | "dibujo";
  departamentos: string[];
  poligono: Polygon | null;
};

/** Focos dentro del área: por departamento o con turf (punto dentro del polígono). */
export function focosDelArea(focos: Foco[], area: Area): Foco[] {
  if (area.modo === "dibujo") {
    const pol = area.poligono;
    if (!pol) return [];
    return focos.filter((f) => booleanPointInPolygon(point([f.lon, f.lat]), pol));
  }
  const elegidos = new Set(area.departamentos);
  return focos.filter((f) => elegidos.has(f.departamento));
}

/** Niveles activos como arreglo [_, pocos, algunos, muchos, muchísimos]. El índice 0 no se usa. */
export type NivelesActivos = [boolean, boolean, boolean, boolean, boolean];
export const TODOS_LOS_NIVELES: NivelesActivos = [true, true, true, true, true];

/** Nivel de cada día del índice, con los límites del área elegida. */
export function nivelesPorDia(indice: IndiceDias, limites: Limites): Map<string, Nivel> {
  const out = new Map<string, Nivel>();
  for (const [dia, t] of indice) out.set(dia, nivelDe(t.peso, limites));
  return out;
}

/** ¿Hay algún nivel marcado? Si no hay ninguno, no se filtra (se ven todos). */
export const hayFiltroNiveles = (activos: NivelesActivos) => activos.slice(1).some(Boolean);

/** Un nivel se muestra si está marcado o si no hay ningún nivel marcado (sin filtro). */
export const nivelVisible = (n: Nivel, activos: NivelesActivos) =>
  n > 0 && (activos[n] || !hayFiltroNiveles(activos));

export function diaActivo(dia: string, niveles: Map<string, Nivel>, activos: NivelesActivos) {
  return nivelVisible(niveles.get(dia) ?? 0, activos);
}

/** Área + periodo + niveles activos: lo que se ve en el mapa, el resumen y la descarga. */
export function filtrarFocos(
  focosArea: Foco[],
  periodo: Periodo,
  niveles: Map<string, Nivel>,
  activos: NivelesActivos,
): Foco[] {
  return focosArea.filter((f) => dentro(f.fecha, periodo) && diaActivo(f.fecha, niveles, activos));
}

/** Alterna un nivel. Se pueden desmarcar todos: eso equivale a no filtrar. */
export function alternarNivel(activos: NivelesActivos, nivel: 1 | 2 | 3 | 4): NivelesActivos {
  const siguiente = [...activos] as NivelesActivos;
  siguiente[nivel] = !siguiente[nivel];
  return siguiente;
}
