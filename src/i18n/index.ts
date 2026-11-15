import { en } from "./en";
import { es, type Textos } from "./es";
import { fijarLocale } from "./formato";
import { qu } from "./qu";

export type { Textos } from "./es";
import { formatoCompacto as compactoBase } from "./formato";
export { formatoDecimal, formatoNumero, formatoPct, formatoPctSigno } from "./formato";

export type CodigoIdioma = "es" | "qu" | "en";

/** Each language is shown by its own name. `lang` goes to the <html lang> attribute. */
export const IDIOMAS: { codigo: CodigoIdioma; nombre: string; lang: string }[] = [
  { codigo: "es", nombre: "Español", lang: "es" },
  { codigo: "qu", nombre: "Runasimi", lang: "qu" },
  { codigo: "en", nombre: "English", lang: "en" },
];

const DICCIONARIOS: Record<CodigoIdioma, Textos> = { es, qu, en };

export const esCodigoIdioma = (c: unknown): c is CodigoIdioma =>
  typeof c === "string" && c in DICCIONARIOS;

/**
 * Texts for the active language. It is a live binding (`export let`): when fijarIdioma is called,
 * every module that imports `t` sees the new dictionary on its next render.
 * The state provider sets it before rendering, so the whole interface changes together.
 */
export let t: Textos = es;

export function fijarIdioma(codigo: CodigoIdioma) {
  t = DICCIONARIOS[codigo];
  fijarLocale(t.locale);
}

const partes = (clave: string) => ({
  anio: Number(clave.slice(0, 4)),
  mes: Number(clave.slice(5, 7)) - 1,
  dia: Number(clave.slice(8, 10)),
});
/** "6 de octubre" / "October 6" */
export const fechaCorta = (clave: string) => t.fechaCorta(partes(clave));
/** "6 de octubre de 2026" / "October 6, 2026" */
export const fechaLarga = (clave: string) => t.fechaLarga(partes(clave));

/** 22397 → "22,4 mil"; in Quechua, "22,4 waranqa" (Intl has no Quechua). */
export const formatoCompacto = (n: number) => {
  const s = compactoBase(n);
  return t.codigo === "qu" ? s.replace(/[\s\u00a0]mil$/, " waranqa") : s;
};
