import { createContext, useContext } from "react";
import type { Polygon } from "geojson";
import type { CodigoIdioma } from "@/i18n";
import type { Foco, IndiceDias } from "@/lib/datos";
import type { Area, NivelesActivos } from "@/lib/filtros";
import type { Resumen } from "@/lib/indicadores";
import type { Limites, Nivel } from "@/lib/niveles";
import type { Granularidad, Periodo } from "@/lib/periodos";

// Contexto separado del proveedor para que la recarga en caliente (HMR) no cree un contexto nuevo.
export type Paneles = { area: boolean; resumen: boolean; fechas: boolean };

export type Tema = "oscuro" | "claro";

export type Estado = {
  // Datos
  cargando: boolean;
  error: string | null;
  anios: number[];
  ultimaFecha: string | null;
  // Filtros
  area: Area;
  anio: number;
  gran: Granularidad;
  mes: number;
  dia: string;
  activos: NivelesActivos;
  paneles: Paneles;
  escala: 0 | 1 | 2;
  idioma: CodigoIdioma;
  tema: Tema;
  dibujoVersion: number;
  // Derivados
  periodo: Periodo;
  etiquetaPeriodo: string;
  etiquetaArea: string;
  indiceArea: IndiceDias;
  limites: Limites;
  niveles: Map<string, Nivel>;
  focosVisibles: Foco[];
  resumen: Resumen;
  totalesDepartamento: Record<string, number>;
  // Acciones
  elegirModo: (modo: Area["modo"]) => void;
  alternarDepartamento: (clave: string) => void;
  fijarDepartamentos: (claves: string[]) => void;
  fijarPoligono: (p: Polygon | null) => void;
  redibujar: () => void;
  elegirAnio: (a: number) => void;
  elegirGran: (g: Granularidad) => void;
  moverMes: (delta: number) => void;
  irAMes: (m: number) => void;
  elegirDia: (d: string) => void;
  alternarNivel: (n: 1 | 2 | 3 | 4) => void;
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
