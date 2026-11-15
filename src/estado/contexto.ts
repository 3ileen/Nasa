import { createContext, useContext } from "react";
import type { CodigoIdioma } from "@/i18n";
import type { AnioRanking, CategoriaId, CeldasAnio, Historico, Mes, Region } from "@/lib/historico";

// Contexto separado del proveedor para que la recarga en caliente (HMR) no cree un contexto nuevo.

export type Tema = "oscuro" | "claro";
export type Granularidad = "anio" | "mes";
export type Paneles = { anios: boolean; resumen: boolean; fechas: boolean };

export type Estado = {
  // Datos
  cargando: boolean;
  error: string | null;
  datos: Historico | null;
  anios: number[];
  /** Años completos con puesto en el ranking. */
  aniosCompletos: number;
  // Selección
  /** "peru" o el id de un departamento. Cambia matriz, ranking, resumen y mapa. */
  region: string;
  regiones: Region[];
  nombreRegion: string;
  anio: number;
  gran: Granularidad;
  /** Mes elegido, 1–12. */
  mes: number;
  /** Categorías resaltadas en la matriz (no filtran el mapa). Vacío = ninguna. */
  activas: CategoriaId[];
  paneles: Paneles;
  escala: 0 | 1 | 2;
  idioma: CodigoIdioma;
  tema: Tema;
  // Derivados
  mesesAnio: (Mes | null)[];
  mesSel: Mes | null;
  rankingAnio: AnioRanking | null;
  etiquetaPeriodo: string;
  celdasAnio: CeldasAnio | null;
  // Acciones
  elegirRegion: (id: string) => void;
  elegirAnio: (a: number) => void;
  elegirGran: (g: Granularidad) => void;
  elegirMes: (m: number) => void;
  /** Elige año y mes a la vez (desde la matriz). */
  elegirPeriodo: (a: number, m: number) => void;
  /** Vuelve a ver el año completo. */
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
