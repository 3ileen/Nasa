import { describe, expect, it } from "vitest";
import { fechaLocal, indicePorDia, leerCsv } from "./datos";
import { claveDepartamento, nombreDepartamento } from "./departamentos";
import { alternarNivel, hayFiltroNiveles, nivelVisible, TODOS_LOS_NIVELES } from "./filtros";
import { calcularResumen } from "./indicadores";
import { calcularLimites, nivelDe, rangosLeyenda } from "./niveles";
import { calcularPeriodo, periodoAnterior, recortar } from "./periodos";

const CSV = `latitud,longitud,fecha,hora_utc,sensor,satelite,peso,frp,confianza,dia_noche,departamento
-8.3,-78.0,2026-10-07,02:29,MODIS,Terra,9.541,22.4,alta,noche,Ancash
-12.6,-76.0,2026-10-06,19:50,VIIRS,N20,1,83.6,nominal,dia,Madre De Dios
-12.6,-76.0,2026-10-06,19:51,VIIRS,N21,1,10,nominal,dia,Fuera_De_Peru`;

describe("datos", () => {
  it("la fecha local de Perú es UTC − 5 h y puede cambiar el día", () => {
    expect(fechaLocal("2026-10-07", "02:29")).toBe("2026-10-06");
    expect(fechaLocal("2026-10-07", "05:00")).toBe("2026-10-07");
    expect(fechaLocal("2026-01-01", "04:59")).toBe("2025-12-31");
  });
  it("descarta Fuera_De_Peru y normaliza el departamento", () => {
    const focos = leerCsv(CSV);
    expect(focos).toHaveLength(2);
    expect(focos.map((f) => f.departamento)).toEqual(["ANCASH", "MADRE DE DIOS"]);
  });
  it("los totales suman la columna peso, no cuentan filas", () => {
    const indice = indicePorDia(leerCsv(CSV));
    expect(indice.get("2026-10-06")?.peso).toBeCloseTo(10.541);
    expect(indice.get("2026-10-06")?.n).toBe(2);
  });
  it("muestra los departamentos con tildes", () => {
    expect(nombreDepartamento(claveDepartamento("Junin"))).toBe("Junín");
    expect(nombreDepartamento(claveDepartamento("Madre De Dios"))).toBe("Madre de Dios");
    expect(nombreDepartamento(claveDepartamento("Ancash"))).toBe("Áncash");
  });
});

describe("niveles", () => {
  it("cuartiles solo con días > 0, redondeados", () => {
    expect(calcularLimites([0, 0, 10, 20, 30, 40, 50])).toEqual([20, 30, 40]);
  });
  it("asigna los 4 niveles según los límites", () => {
    const l = calcularLimites([10, 20, 30, 40, 50]);
    expect([0, 5, 20, 21, 30, 40, 41].map((v) => nivelDe(v, l))).toEqual([0, 1, 1, 2, 2, 3, 4]);
    expect(rangosLeyenda(l).map((r) => [r.desde, r.hasta])).toEqual([
      [1, 20],
      [21, 30],
      [31, 40],
      [41, null],
    ]);
  });
  it("se pueden desmarcar todos los niveles y eso equivale a no filtrar", () => {
    let a = TODOS_LOS_NIVELES;
    for (const n of [1, 2, 3, 4] as const) a = alternarNivel(a, n);
    expect(hayFiltroNiveles(a)).toBe(false);
    expect([1, 2, 3, 4].every((n) => nivelVisible(n as 1 | 2 | 3 | 4, a))).toBe(true);
    expect(nivelVisible(0, a)).toBe(false);
    // Con un solo nivel marcado, solo ese se ve.
    a = alternarNivel(a, 4);
    expect(nivelVisible(4, a)).toBe(true);
    expect(nivelVisible(1, a)).toBe(false);
  });
});

describe("periodos", () => {
  it("la semana va de lunes a domingo", () => {
    // 2026-10-07 es miércoles
    expect(calcularPeriodo("semana", 2026, 9, "2026-10-07")).toMatchObject({
      inicio: "2026-10-05",
      fin: "2026-10-11",
    });
  });
  it("el periodo anterior tiene la misma duración", () => {
    const p = calcularPeriodo("mes", 2026, 9, "2026-10-01");
    expect(periodoAnterior(p)).toMatchObject({ inicio: "2026-08-31", fin: "2026-09-30" });
  });
  it("un mes en curso se compara solo con los días que ya tienen datos", () => {
    const p = recortar(calcularPeriodo("mes", 2026, 10, "2026-11-01"), "2026-11-13");
    expect(p.fin).toBe("2026-11-13");
    expect(periodoAnterior(p)).toMatchObject({ inicio: "2026-10-19", fin: "2026-10-31" });
  });
});

describe("indicadores", () => {
  it("calcula totales, cambio y porcentajes", () => {
    const focos = leerCsv(CSV);
    const r = calcularResumen({
      focos,
      anteriores: [{ ...focos[1]!, peso: 5 }],
      periodo: calcularPeriodo("mes", 2026, 9, "2026-10-01"),
      niveles: new Map(),
      ultimaFecha: "2026-10-31",
      mostrarDepartamento: true,
    });
    expect(r.total).toBeCloseTo(10.541);
    expect(r.detecciones).toBe(2);
    expect(r.cambio).toMatchObject({ tipo: "porcentaje" });
    expect(r.pctNoche).toBe(50);
    expect(r.frpMax?.frp).toBe(83.6);
    expect(r.depTop?.departamento).toBe("ANCASH");
    expect(r.barras).toHaveLength(31);
  });
});
