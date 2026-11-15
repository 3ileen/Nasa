// Number formatting for the active language. Set by i18n/index.ts when the language changes.
const opciones = (min: number, max: number) =>
  ({
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    useGrouping: "always",
  }) as unknown as Intl.NumberFormatOptions;

let enteros = new Intl.NumberFormat("es-ES", opciones(0, 0));
let unDecimal = new Intl.NumberFormat("es-ES", opciones(1, 1));
let compacto = new Intl.NumberFormat("es-ES", { notation: "compact", maximumFractionDigits: 1 });
let localeActual = "es-ES";

export function fijarLocale(locale: string) {
  if (locale === localeActual) return;
  localeActual = locale;
  enteros = new Intl.NumberFormat(locale, opciones(0, 0));
  unDecimal = new Intl.NumberFormat(locale, opciones(1, 1));
  compacto = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
}

/** 2109 → "2.109" (Spanish) or "2,109" (English) */
export function formatoNumero(n: number) {
  return enteros.format(Math.round(n));
}
/** 123.45 → "123,5" (Spanish) or "123.5" (English) */
export function formatoDecimal(n: number) {
  return unDecimal.format(n);
}
export function formatoPct(n: number) {
  return `${enteros.format(Math.round(n))}%`;
}
/** 22397 → "22,4 mil" (Spanish) or "22.4K" (English). Below 10 000 it uses the full number. */
export function formatoCompacto(n: number) {
  return Math.abs(n) < 10000 ? formatoNumero(n) : compacto.format(n);
}
/** +6,7 % / −12,3 %: signed, one decimal. */
export function formatoPctSigno(n: number) {
  const v = unDecimal.format(Math.abs(n));
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${v}%`;
}
