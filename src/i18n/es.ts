// Textos en español (idioma base). Los demás idiomas (en.ts, qu.ts, ay.ts) tienen
// exactamente la misma forma: el tipo Textos obliga a traducir todas las claves.
import { formatoNumero } from "./formato";

/** Fecha descompuesta: mes de 0 a 11. */
export type FechaPartes = { dia: number; mes: number; anio: number };

const meses = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export const es = {
  codigo: "es",
  locale: "es-ES",

  titulo: "Focos de calor del Perú",
  subtitulo: "MODIS + VIIRS en una sola serie",
  equipo: "NASA Space Apps Challenge 2026 · Junior FC, Moquegua",
  saltar: "Saltar a los filtros",
  idioma: "Idioma",
  reducirTexto: "Reducir tamaño del texto",
  aumentarTexto: "Aumentar tamaño del texto",
  tamanoTexto: (pct: number) => `Tamaño del texto: ${pct}%`,

  // Paneles
  ocultar: (panel: string) => `Ocultar ${panel}`,
  mostrar: (panel: string) => `Mostrar ${panel}`,

  // Área
  area: "Área de interés",
  areaCorta: "Área",
  departamentos: "Departamentos",
  dibujar: "Dibujar área",
  buscar: "Buscar departamento",
  buscarPlaceholder: "Buscar departamento…",
  todoPeru: "Todo el Perú",
  quitarTodos: "Quitar todos",
  quitar: (n: string) => `Quitar ${n}`,
  sinResultados: "No se encontraron departamentos",
  elegidos: (n: number) => `${n} de 25 elegidos`,
  totalAnual: (anio: number) => `Focos equivalentes en ${anio}`,
  ayudaDibujo: "Toca el mapa para marcar tu área. Ciérrala en el primer punto o con «Listo».",
  redibujar: "Borrar y dibujar otra área",
  deshacer: "Deshacer",
  listo: "Listo",
  areaDibujada: "Área dibujada",
  sinArea: "Ningún área elegida",
  nDepartamentos: (n: number) => `${n} departamentos`,
  descargar: "Descargar estos datos (CSV)",
  resumen: "Resumen",
  focosEq: "focos equivalentes",
  detecciones: (n: number) => `${formatoNumero(n)} ${n === 1 ? "detección" : "detecciones"}`,
  diaMax: "Día con más fuego",
  vsAnterior: "Frente al periodo anterior",
  mismosDias: (n: number) => `${n} ${n === 1 ? "día" : "días"} antes`,
  sinAnterior: "Sin datos del periodo anterior",
  anteriorCero: "Sin focos en el periodo anterior",
  subio: "subió",
  bajo: "bajó",
  mesMax: "Mes más activo",
  frpMax: "Foco más intenso",
  confianzaAlta: "Confianza alta",
  deNoche: "Detectados de noche",
  depTop: "Departamento con más focos",
  delTotal: "del total",
  delasDetecciones: "de las detecciones",
  graficoDia: "Focos equivalentes por día",
  graficoMes: "Focos equivalentes por mes",
  maximo: "Máximo",
  notaEquivalentes:
    "Focos equivalentes: cada detección MODIS se suma con su peso para igualar la escala de VIIRS.",
  sinFocos: "No hay focos en esta área y periodo.",
  cargando: "Cargando datos…",
  errorDatos: "No se pudieron cargar los datos.",
  eligeArea: "Elige al menos un departamento o dibuja un área.",
  dibujaArea: "Dibuja tu área en el mapa para ver sus focos.",

  // Fechas
  fechas: "Fechas",
  anio: "Año",
  datosHasta: (fecha: string) => `datos hasta el ${fecha}`,
  verPor: "Ver por",
  gran: { anio: "Año", mes: "Mes", semana: "Semana", dia: "Día" },
  mesAnterior: "Mes anterior",
  mesSiguiente: "Mes siguiente",
  mostrando: "Mostrando",
  verDoce: "Ver los 12 meses juntos",
  irAlMes: (mes: string, total: string) => `Ir a ${mes}: ${total} focos equivalentes`,
  leyenda: "Niveles de actividad",
  leyendaNota: "Calculados para el área elegida.",
  sinFiltroNiveles: "Sin filtro.",
  niveles: ["Sin focos", "Pocos", "Algunos", "Muchos", "Muchísimos"],
  hasta: (n: string) => `hasta ${n} por día`,
  rango: (a: string, b: string) => `${a}–${b} por día`,
  masDe: (n: string) => `más de ${n} por día`,
  porDia: (n: string) => `${n} por día`,
  rangoVacio: "sin días en este rango",
  sinDatosTodavia: "Sin datos todavía",
  diaSinFocos: "Sin focos",
  diaSinDatos: "Día sin datos todavía",
  ariaDia: (dia: number, mes: string, total: string, estado?: string) =>
    `${dia} de ${mes}: ${estado ?? `${total} focos equivalentes`}`,
  nivelOculto: "nivel oculto",

  // Mapa
  mapaDescripcion:
    "Mapa de focos de calor del Perú. Usa las flechas para moverte y las teclas más y menos para acercarte. Para elegir departamentos también puedes usar la lista del panel Área de interés.",
  cargandoMapa: "Cargando mapa…",
  controlesMapa: "Controles del mapa",
  relieve: "Relieve del terreno",
  coloresAltura: "Colores por altura",
  modoClaro: "Activar modo claro",
  modoOscuro: "Activar modo oscuro",
  verPeru: "Ver todo el Perú",
  irArea: "Ir a mi área",
  acercar: "Acercar mapa",
  alejar: "Alejar mapa",
  enMapa: (n: number, periodo: string) =>
    `En el mapa: ${formatoNumero(n)} ${n === 1 ? "detección" : "detecciones"} de ${periodo}`,
  tooltipFoco: (fecha: string, peso: string, frp: string, confianza: string) =>
    `${fecha}<br>${peso} focos equivalentes<br>FRP ${frp} MW · confianza ${confianza}`,
  /** Valores de la columna "confianza" del CSV. */
  confianzaValores: { nominal: "nominal", alta: "alta" } as Record<string, string>,

  // Calendario y fechas
  meses,
  mesesCortos: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  diasSemana: ["L", "M", "M", "J", "V", "S", "D"],
  diasSemanaLargos: ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"],
  /** "6 de octubre" */
  fechaCorta: (f: FechaPartes) => `${f.dia} de ${meses[f.mes]}`,
  /** "6 de octubre de 2026" */
  fechaLarga: (f: FechaPartes) => `${f.dia} de ${meses[f.mes]} de ${f.anio}`,
  /** "octubre 2026" */
  mesAnio: (mes: number, anio: number) => `${meses[mes]} ${anio}`,
  /** "la semana del 5 al 11 de octubre de 2026" */
  semana: (i: FechaPartes, f: FechaPartes) =>
    i.mes === f.mes
      ? `la semana del ${i.dia} al ${f.dia} de ${meses[f.mes]} de ${f.anio}`
      : `la semana del ${i.dia} de ${meses[i.mes]} al ${f.dia} de ${meses[f.mes]} de ${f.anio}`,
};

export type Textos = typeof es;
