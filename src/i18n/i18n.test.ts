import { afterEach, describe, expect, it } from "vitest";
import { en } from "./en";
import { es } from "./es";
import { fechaCorta, fechaLarga, fijarIdioma, formatoNumero, IDIOMAS, t } from ".";
import { qu } from "./qu";

const DICCIONARIOS = { es, en, qu };

/** Walks the dictionary and returns the paths of empty values. */
function vacios(obj: Record<string, unknown>, prefijo = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const ruta = `${prefijo}${k}`;
    if (typeof v === "string") return v.trim() ? [] : [ruta];
    if (Array.isArray(v)) return v.some((x) => !String(x).trim()) ? [ruta] : [];
    if (v && typeof v === "object") return vacios(v as Record<string, unknown>, `${ruta}.`);
    return [];
  });
}

afterEach(() => fijarIdioma("es"));

describe("translations", () => {
  it("all languages have exactly the same keys as Spanish", () => {
    const claves = Object.keys(es).sort();
    for (const d of Object.values(DICCIONARIOS)) expect(Object.keys(d).sort()).toEqual(claves);
  });

  it("no text is empty and lists have the correct length", () => {
    for (const [codigo, d] of Object.entries(DICCIONARIOS)) {
      expect(vacios(d as unknown as Record<string, unknown>), codigo).toEqual([]);
      expect(d.meses, codigo).toHaveLength(12);
      expect(d.mesesCortos, codigo).toHaveLength(12);
      expect(Object.keys(d.categorias).sort(), codigo).toEqual(Object.keys(es.categorias).sort());
      expect(Object.keys(d.calidades).sort(), codigo).toEqual(Object.keys(es.calidades).sort());
      expect(Object.keys(d.fuentes).sort(), codigo).toEqual(Object.keys(es.fuentes).sort());
    }
  });

  it("the selector offers the three languages", () => {
    expect(IDIOMAS.map((i) => i.codigo)).toEqual(["es", "qu", "en"]);
  });

  it("fijarIdioma changes texts, dates and number formatting", () => {
    expect(t.titulo).toBe("Focos de calor del Perú");
    expect(fechaLarga("2026-10-06")).toBe("6 de octubre de 2026");
    expect(formatoNumero(2109)).toBe("2.109");

    fijarIdioma("en");
    expect(t.titulo).toBe("Fire Hotspots in Peru");
    expect(fechaCorta("2026-10-06")).toBe("October 6");
    expect(formatoNumero(2109)).toBe("2,109");

    fijarIdioma("qu");
    expect(t.mesEtiqueta).toBe("Killa");
    expect(formatoNumero(2109)).toBe("2.109");
  });
});
