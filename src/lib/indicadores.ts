import type { Foco } from "./datos";
import type { Nivel } from "./niveles";
import { diasDe, mesDe, type Periodo } from "./periodos";

export type Barra = {
  clave: string;
  /** Total por nivel (índices 1–4). */
  porNivel: [number, number, number, number, number];
  total: number;
  sinDatos: boolean;
};

export type Cambio =
  { tipo: "porcentaje"; valor: number } | { tipo: "anteriorCero" } | { tipo: "sinDatos" };

export type Resumen = {
  total: number;
  detecciones: number;
  diaMax: { fecha: string; total: number } | null;
  cambio: Cambio | null;
  mesMax: { mes: number; total: number } | null;
  frpMax: { frp: number; departamento: string; fecha: string } | null;
  pctAlta: number | null;
  pctNoche: number | null;
  depTop: { departamento: string; pct: number } | null;
  barras: Barra[];
};

export const sumaPesos = (focos: Foco[]) => focos.reduce((s, f) => s + f.peso, 0);

function porClave(focos: Foco[], clave: (f: Foco) => string) {
  const m = new Map<string, number>();
  for (const f of focos) m.set(clave(f), (m.get(clave(f)) ?? 0) + f.peso);
  return m;
}

function maximo(m: Map<string, number>) {
  let mejor: [string, number] | null = null;
  for (const e of m) if (!mejor || e[1] > mejor[1]) mejor = e;
  return mejor;
}

export function calcularResumen(opts: {
  focos: Foco[];
  /** null = no hay datos cargados del periodo anterior. */
  anteriores: Foco[] | null;
  periodo: Periodo;
  niveles: Map<string, Nivel>;
  ultimaFecha: string | null;
  mostrarDepartamento: boolean;
}): Resumen {
  const { focos, anteriores, periodo, niveles, ultimaFecha } = opts;
  const total = sumaPesos(focos);
  const n = focos.length;

  const porDia = porClave(focos, (f) => f.fecha);
  const dm = maximo(porDia);

  let cambio: Cambio | null = null;
  let mesMax: Resumen["mesMax"] = null;
  if (periodo.gran === "anio") {
    const mm = maximo(porClave(focos, (f) => f.fecha.slice(5, 7)));
    mesMax = mm ? { mes: Number(mm[0]) - 1, total: mm[1] } : null;
  } else if (!anteriores) cambio = { tipo: "sinDatos" };
  else {
    const prev = sumaPesos(anteriores);
    cambio =
      prev > 0
        ? { tipo: "porcentaje", valor: ((total - prev) / prev) * 100 }
        : { tipo: "anteriorCero" };
  }

  let frpMax: Resumen["frpMax"] = null;
  for (const f of focos)
    if (!frpMax || f.frp > frpMax.frp)
      frpMax = { frp: f.frp, departamento: f.departamento, fecha: f.fecha };

  const dt = opts.mostrarDepartamento ? maximo(porClave(focos, (f) => f.departamento)) : null;

  const barras: Barra[] = [];
  if (periodo.gran === "anio") {
    const anio = periodo.inicio.slice(0, 4);
    for (let m = 0; m < 12; m++)
      barras.push({
        clave: `${anio}-${String(m + 1).padStart(2, "0")}`,
        porNivel: [0, 0, 0, 0, 0],
        total: 0,
        sinDatos: !!ultimaFecha && `${anio}-${String(m + 1).padStart(2, "0")}-01` > ultimaFecha,
      });
    for (const f of focos) {
      const b = barras[mesDe(f.fecha)];
      if (!b) continue;
      b.total += f.peso;
      b.porNivel[niveles.get(f.fecha) ?? 0] += f.peso;
    }
  } else {
    for (const dia of diasDe(periodo)) {
      const t = porDia.get(dia) ?? 0;
      const porNivel: Barra["porNivel"] = [0, 0, 0, 0, 0];
      porNivel[niveles.get(dia) ?? 0] = t;
      barras.push({ clave: dia, porNivel, total: t, sinDatos: !!ultimaFecha && dia > ultimaFecha });
    }
  }

  return {
    total,
    detecciones: n,
    diaMax: dm ? { fecha: dm[0], total: dm[1] } : null,
    cambio,
    mesMax,
    frpMax,
    pctAlta: n ? (focos.filter((f) => f.confianza === "alta").length / n) * 100 : null,
    pctNoche: n ? (focos.filter((f) => f.noche).length / n) * 100 : null,
    depTop: dt && total > 0 ? { departamento: dt[0], pct: (dt[1] / total) * 100 } : null,
    barras,
  };
}
