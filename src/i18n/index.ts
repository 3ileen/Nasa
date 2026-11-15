import { en } from "./en";
import { es, type Textos } from "./es";
import { fijarLocale } from "./formato";
import { qu } from "./qu";

export type { Textos } from "./es";
export {
  formatoCompacto,
  formatoDecimal,
  formatoNumero,
  formatoPct,
  formatoPctSigno,
} from "./formato";

export type CodigoIdioma = "es" | "qu" | "en";

/** Cada idioma se muestra con su propio nombre. `lang` va al atributo <html lang>. */
export const IDIOMAS: { codigo: CodigoIdioma; nombre: string; lang: string }[] = [
  { codigo: "es", nombre: "Español", lang: "es" },
  { codigo: "qu", nombre: "Runasimi", lang: "qu" },
  { codigo: "en", nombre: "English", lang: "en" },
];

const DICCIONARIOS: Record<CodigoIdioma, Textos> = { es, qu, en };

export const esCodigoIdioma = (c: unknown): c is CodigoIdioma =>
  typeof c === "string" && c in DICCIONARIOS;

/**
 * Textos del idioma activo. Es un enlace vivo (`export let`): al llamar a fijarIdioma,
 * todos los módulos que importan `t` ven el nuevo diccionario en su siguiente render.
 * El proveedor de estado lo fija antes de renderizar, así que toda la interfaz cambia junta.
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
