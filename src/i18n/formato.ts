// Formato de números según el idioma activo. Lo fija i18n/index.ts al cambiar de idioma.
const opciones = (min: number, max: number) =>
  ({
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    useGrouping: "always",
  }) as unknown as Intl.NumberFormatOptions;

let enteros = new Intl.NumberFormat("es-ES", opciones(0, 0));
let unDecimal = new Intl.NumberFormat("es-ES", opciones(1, 1));
let localeActual = "es-ES";

export function fijarLocale(locale: string) {
  if (locale === localeActual) return;
  localeActual = locale;
  enteros = new Intl.NumberFormat(locale, opciones(0, 0));
  unDecimal = new Intl.NumberFormat(locale, opciones(1, 1));
}

/** 2109 → "2.109" (español) o "2,109" (inglés) */
export function formatoNumero(n: number) {
  return enteros.format(Math.round(n));
}
/** 123.45 → "123,5" (español) o "123.5" (inglés) */
export function formatoDecimal(n: number) {
  return unDecimal.format(n);
}
export function formatoPct(n: number) {
  return `${enteros.format(Math.round(n))}%`;
}
