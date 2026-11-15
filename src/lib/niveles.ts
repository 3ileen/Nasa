import type { IndiceDias } from "./datos";

/** 0 = sin focos; 1 Pocos, 2 Algunos, 3 Muchos, 4 Muchísimos. */
export type Nivel = 0 | 1 | 2 | 3 | 4;
export const NIVELES_ACTIVABLES = [1, 2, 3, 4] as const;

/** Límites redondeados [Q25, Q50, Q75]. */
export type Limites = [number, number, number];

/** Cuantil con interpolación lineal (mismo método que Excel PERCENTIL.INC). */
export function cuantil(ordenados: number[], p: number): number {
  if (!ordenados.length) return 0;
  const pos = (ordenados.length - 1) * p;
  const base = Math.floor(pos);
  const resto = pos - base;
  const a = ordenados[base] ?? 0;
  const b = ordenados[base + 1] ?? a;
  return a + (b - a) * resto;
}

/** Cuartiles de la suma de pesos por día, usando solo los días con focos (> 0). */
export function calcularLimites(valores: Iterable<number>): Limites {
  const con = [...valores].filter((v) => v > 0).sort((a, b) => a - b);
  return [
    Math.round(cuantil(con, 0.25)),
    Math.round(cuantil(con, 0.5)),
    Math.round(cuantil(con, 0.75)),
  ];
}

export function limitesDelAnio(indice: IndiceDias, anio: number): Limites {
  const prefijo = `${anio}-`;
  const valores: number[] = [];
  for (const [dia, t] of indice) if (dia.startsWith(prefijo)) valores.push(t.peso);
  return calcularLimites(valores);
}

/** Se compara el total redondeado (el que se ve en pantalla) con los límites enteros. */
export function nivelDe(valor: number, [q25, q50, q75]: Limites): Nivel {
  if (!(valor > 0)) return 0;
  const v = Math.max(1, Math.round(valor));
  if (v <= q25) return 1;
  if (v <= q50) return 2;
  if (v <= q75) return 3;
  return 4;
}

/** Rangos enteros de la leyenda. hasta = null → "más de". Si un rango queda vacío, desde > hasta. */
export function rangosLeyenda([q25, q50, q75]: Limites) {
  return [
    { nivel: 1 as const, desde: 1, hasta: q25 as number | null },
    { nivel: 2 as const, desde: q25 + 1, hasta: q50 as number | null },
    { nivel: 3 as const, desde: q50 + 1, hasta: q75 as number | null },
    { nivel: 4 as const, desde: q75 + 1, hasta: null },
  ];
}

/** Colores de referencia (los mismos tokens --level-N de styles.css). */
export const VARIABLE_NIVEL: Record<Nivel, string> = {
  0: "--level-0",
  1: "--level-1",
  2: "--level-2",
  3: "--level-3",
  4: "--level-4",
};
