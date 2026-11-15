import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  claseMapa,
  COLORES_CATEGORIA,
  CORTES_MAPA,
  filasCsv,
  mesesDelAnio,
  resumenMeses,
  type AnioRanking,
  type Mes,
} from "./historico";

// Se prueba contra los archivos reales de public/data/historico (contrato de output/frontend_datos.md).
const leer = <T>(f: string): T =>
  JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../../public/data/historico", f), "utf8"),
  ) as T;
const meses = leer<{ meses: Mes[] }>("calendar_peru.json").meses;
const ranking = leer<{ anios: AnioRanking[] }>("ranking_peru.json").anios;

describe("datos históricos", () => {
  it("el calendario cubre de julio de 2002 a diciembre de 2024 (270 meses)", () => {
    expect(meses).toHaveLength(270);
    expect(mesesDelAnio(meses, 2002).slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(mesesDelAnio(meses, 2024).every(Boolean)).toBe(true);
  });

  it("el ranking pone primero a 2005 y deja sin puesto a los años incompletos", () => {
    expect(ranking[0]?.anio).toBe(2005);
    expect(
      ranking
        .filter((r) => r.puesto === null)
        .map((r) => r.anio)
        .sort(),
    ).toEqual([2002, 2010]);
  });

  it("cuenta los meses sobre y bajo lo normal", () => {
    const r = resumenMeses(mesesDelAnio(meses, 2024));
    expect(r.sobre + r.bajo).toBeLessThanOrEqual(12);
    expect(r.sobre).toBeGreaterThan(0);
  });

  it("la descarga trae una fila por mes con datos", () => {
    expect(filasCsv(mesesDelAnio(meses, 2002))).toHaveLength(6);
    expect(filasCsv(mesesDelAnio(meses, 2024))[8]).toMatchObject({ anio: 2024, mes: 9 });
  });
});

describe("escala del mapa", () => {
  it("0 no se pinta y los cortes son inclusivos", () => {
    expect(claseMapa(0, CORTES_MAPA.anio)).toBe(-1);
    expect([1, 10, 11, 50, 51, 400, 401].map((v) => claseMapa(v, CORTES_MAPA.anio))).toEqual([
      0, 0, 1, 1, 2, 3, 4,
    ]);
  });
});

describe("colores frente a lo usual", () => {
  it("en cada tema, cada categoría tiene su propio color", () => {
    const orden = [
      "muy_por_debajo",
      "por_debajo",
      "normal",
      "por_encima",
      "muy_por_encima",
      "maximo",
    ];
    for (const tema of ["oscuro", "claro"] as const) {
      const colores = orden.map((c) => COLORES_CATEGORIA[tema][c]);
      expect(new Set(colores).size, tema).toBe(orden.length);
    }
  });
});
