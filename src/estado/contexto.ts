import { createContext, useContext } from "react";
import type { CodigoIdioma } from "@/i18n";
import type { AnioRanking, CategoriaId, CeldasAnio, Historico, Mes, Region } from "@/lib/historico";

// Context kept separate from the provider so hot reloading (HMR) doesn't create a new context.

export type Tema = "oscuro" | "claro";
export type Granularidad = "anio" | "mes";
export type Paneles = { anios: boolean; resumen: boolean; fechas: boolean };

export type Estado = {
  // Data
  cargando: boolean;
  error: string | null;
  datos: Historico | null;
  anios: number[];
  /** Complete years with a rank in the ranking. */
  aniosCompletos: number;
  // Selection
  /** "peru" or a department id. Changes the matrix, ranking, summary and map. */
  region: string;
  regiones: Region[];
  nombreRegion: string;
  anio: number;
  gran: Granularidad;
  /** Selected month, 1–12. */
  mes: number;
  /** Categories highlighted in the matrix (they don't filter the map). Empty = none. */
  activas: CategoriaId[];
  paneles: Paneles;
  escala: 0 | 1 | 2;
  idioma: CodigoIdioma;
  tema: Tema;
  // Derived
  mesesAnio: (Mes | null)[];
  mesSel: Mes | null;
  rankingAnio: AnioRanking | null;
  etiquetaPeriodo: string;
  celdasAnio: CeldasAnio | null;
  // Actions
  elegirRegion: (id: string) => void;
  elegirAnio: (a: number) => void;
  elegirGran: (g: Granularidad) => void;
  elegirMes: (m: number) => void;
  /** Selects year and month at once (from the matrix). */
  elegirPeriodo: (a: number, m: number) => void;
  /** Goes back to viewing the full year. */
  verAnioCompleto: () => void;
  limpiarCategorias: () => void;
  alternarCategoria: (c: CategoriaId) => void;
  categoriaVisible: (c: CategoriaId) => boolean;
  alternarPanel: (p: keyof Paneles) => void;
  fijarEscala: (e: 0 | 1 | 2) => void;
  elegirIdioma: (c: CodigoIdioma) => void;
  alternarTema: () => void;
};

export const Contexto = createContext<Estado | null>(null);

export function useEstado() {
  const e = useContext(Contexto);
  if (!e) throw new Error("useEstado debe usarse dentro de <ProveedorEstado>");
  return e;
}
