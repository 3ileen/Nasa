// Anomaly category colors: intensity scale from light to dark.
import { t } from "@/i18n";
import { COLORES_CATEGORIA, type CategoriaId, type Mes, type Meta } from "@/lib/historico";

/** Background color of a category (app intensity scale; meta is kept for compatibility). */
export function colorCategoria(_meta: Meta | undefined, cat: CategoriaId | null | undefined) {
  // The provider sets data-tema before rendering, so the current theme is already set here.
  const tema =
    typeof document !== "undefined" && document.documentElement.dataset["tema"] === "claro"
      ? "claro"
      : "oscuro";
  const paleta = COLORES_CATEGORIA[tema];
  return paleta[cat ?? "sin_dato"] ?? paleta["sin_dato"] ?? "#9AA0A8";
}

const luminancia = (hex: string) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
};

/** Black or white, whichever has more contrast against the given color. */
export function textoSobre(hex: string) {
  const l = luminancia(hex);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? "#000000" : "#FFFFFF";
}

export const nombreCategoria = (cat: CategoriaId | null | undefined) =>
  t.categorias[cat ?? "sin_dato"] ?? cat ?? "";

export const nombreFuente = (f: string) => t.fuentes[f] ?? f;
export const nombreCalidad = (c: string) => t.calidades[c] ?? c;

/**
 * Category shown for a month: no data if there is no count, and preliminary (NRT) data is
 * never presented as a record (the guide requires this): it is shown as "much more than usual".
 */
export function categoriaMostrada(m: Pick<Mes, "count" | "cat" | "preliminar">): CategoriaId {
  if (m.count === null) return "sin_dato";
  if (m.preliminar && m.cat === "maximo") return "muy_por_encima";
  return m.cat;
}
