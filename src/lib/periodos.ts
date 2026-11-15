export type Granularidad = "anio" | "mes" | "semana" | "dia";
/** Fechas YYYY-MM-DD, ambas incluidas. */
export type Periodo = { gran: Granularidad; inicio: string; fin: string };

const DIA_MS = 86_400_000;
const aMs = (clave: string) => {
  const [y, m, d] = clave.split("-").map(Number);
  return Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1);
};
const aClave = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export const claveFecha = (anio: number, mes: number, dia: number) =>
  `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
export const sumarDias = (clave: string, n: number) => aClave(aMs(clave) + n * DIA_MS);
export const diasEntre = (a: string, b: string) => Math.round((aMs(b) - aMs(a)) / DIA_MS);
export const diasDelMes = (anio: number, mes: number) =>
  new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
/** 0 = lunes … 6 = domingo. */
export const diaSemana = (clave: string) => (new Date(aMs(clave)).getUTCDay() + 6) % 7;
export const lunesDe = (clave: string) => sumarDias(clave, -diaSemana(clave));
export const mesDe = (clave: string) => Number(clave.slice(5, 7)) - 1;
export const anioDe = (clave: string) => Number(clave.slice(0, 4));

export function calcularPeriodo(
  gran: Granularidad,
  anio: number,
  mes: number,
  dia: string,
): Periodo {
  switch (gran) {
    case "anio":
      return { gran, inicio: claveFecha(anio, 0, 1), fin: claveFecha(anio, 11, 31) };
    case "mes":
      return {
        gran,
        inicio: claveFecha(anio, mes, 1),
        fin: claveFecha(anio, mes, diasDelMes(anio, mes)),
      };
    case "semana": {
      const lunes = lunesDe(dia);
      return { gran, inicio: lunes, fin: sumarDias(lunes, 6) };
    }
    case "dia":
      return { gran, inicio: dia, fin: dia };
  }
}

export const duracion = (p: Periodo) => diasEntre(p.inicio, p.fin) + 1;

/** Periodo inmediatamente anterior con la misma cantidad de días. */
export function periodoAnterior(p: Periodo): Periodo {
  const n = duracion(p);
  return { gran: p.gran, inicio: sumarDias(p.inicio, -n), fin: sumarDias(p.inicio, -1) };
}

export const dentro = (clave: string, p: Periodo) => clave >= p.inicio && clave <= p.fin;

export function diasDe(p: Periodo): string[] {
  const out: string[] = [];
  for (let d = p.inicio; d <= p.fin; d = sumarDias(d, 1)) out.push(d);
  return out;
}

/** Recorta un periodo a la última fecha con datos (para no comparar días aún sin datos). */
export function recortar(p: Periodo, ultima: string | null): Periodo {
  if (!ultima || p.fin <= ultima) return p;
  return { ...p, fin: ultima < p.inicio ? p.inicio : ultima };
}
