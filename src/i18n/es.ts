// Spanish texts (base language). en.ts and qu.ts have exactly the same shape:
// the Textos type forces every key to be translated.

/** Date split into parts: month from 0 to 11. */
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
  subtitulo: "MODIS + VIIRS en una sola serie, 2002–2026",
  equipo: "NASA Space Apps Challenge 2026 · Junior FC, Moquegua",
  saltar: "Saltar a los filtros",
  idioma: "Idioma",
  reducirTexto: "Reducir tamaño del texto",
  aumentarTexto: "Aumentar tamaño del texto",
  tamanoTexto: (pct: number) => `Tamaño del texto: ${pct}%`,
  modoClaro: "Activar modo claro",
  modoOscuro: "Activar modo oscuro",
  ocultar: (panel: string) => `Ocultar ${panel}`,
  peru: "Perú",

  // Years panel
  tramo: { estimado: "estimado", viirs_real: "VIIRS real" },
  descargar: "Descargar estos datos (CSV)",

  // Summary
  resumen: "Resumen",
  focosEq: "focos equivalentes",
  entre: (a: string, b: string) => `entre ${a} y ${b}`,
  loNormalDet: (mediana: string) => `mediana ${mediana}`,
  mesPico: "Mes más activo",
  agoSep: "En agosto y septiembre",
  delAnio: "del año",
  frp: "Potencia del fuego",
  frpDet: "suma de FRP",
  satelite: "Satélite",
  medianaLeyenda: "mediana",
  maximo: "Máximo",
  avisoEstimado: "Estimado con MODIS Aqua, calibrado con VIIRS.",
  avisoIncierta: (a: string, b: string) => `Por el margen de error podría ser «${a}» o «${b}».`,
  avisoSinDato: "Sin observación completa del satélite.",
  avisoFrp: "El FRP estimado tiende a sobrestimarse (~12 %).",
  nota: "Focos en equivalente VIIRS 375 m. De 2002 a 2011 se estiman con MODIS Aqua × factor de temporada.",
  cargando: "Cargando datos…",
  errorDatos: "No se pudieron cargar los datos.",

  // Dates
  region: "Región",
  avisoRegion: "Datos por región: recorte aproximado y sin margen de error en los años estimados.",
  anio: "Año",
  anioAnterior: "Año anterior",
  anioSiguiente: "Año siguiente",
  leyendaNota: (a: number, b: number) => `Comparado con ${a}–${b}.`,
  incierto: "Color incierto",
  sinDato: "Sin dato",
  calidades: {
    ok: "Completo",
    parcial: "Parcial",
    incompleto: "Incompleto",
    relleno: "Relleno con Aqua",
    "sin dato": "Sin dato",
  } as Record<string, string>,
  fuentes: {
    estimado: "MODIS Aqua (estimado)",
    "S-NPP": "VIIRS S-NPP",
    "NOAA-20": "VIIRS NOAA-20",
    "NOAA-20+S-NPP": "VIIRS S-NPP y NOAA-20",
    "S-NPP+estimado": "VIIRS S-NPP y estimado",
    "sin dato": "Sin dato",
  } as Record<string, string>,

  // Period and matrix
  periodo: "Periodo",
  mesEtiqueta: "Mes",
  todoElAnio: "Todo el año",
  sincronizado: "Lo elegido se marca igual en la matriz",
  vistaCalendario: "Calendario",
  vistaTop: "Top años",
  colFocos: "Focos",
  notaTop: (a: number, b: number) => `Color: el año frente a un año usual (${a}–${b}).`,
  tooltipTop: (anio: number, focos: string, situacion: string) =>
    `${anio}: ${focos} focos · ${situacion}`,
  todosLosAnios: "Todos los años",
  ayudaMatriz: "Toca un mes, o un año para verlo completo.",
  comparadoMismoMes: (a: number, b: number) => `Fuego comparado con el mismo mes en ${a}–${b}`,
  categoriasCortas: {
    muy_por_debajo: "Mucho menos fuego",
    por_debajo: "Menos fuego",
    normal: "Fuego usual",
    por_encima: "Más fuego",
    muy_por_encima: "Mucho más fuego",
    maximo: "Récord de fuego",
    sin_dato: "Sin dato",
  } as Record<string, string>,
  categorias: {
    muy_por_debajo: "Mucho menos fuego que lo usual",
    por_debajo: "Menos fuego que lo usual",
    normal: "Fuego usual para ese mes",
    por_encima: "Más fuego que lo usual",
    muy_por_encima: "Mucho más fuego que lo usual",
    maximo: "Récord: el más alto desde 2003",
    sin_dato: "Sin dato completo",
  } as Record<string, string>,
  eligeMesResaltado: "Elige en la matriz un mes resaltado para verlo en el mapa",
  ayudaResaltar: "Toca un color para resaltar esos meses.",
  limpiarFiltros: "Limpiar filtros",
  estimadoAqua: "2002–2011: estimado con MODIS Aqua",
  tooltipMatriz: (mes: string, anio: number, focos: string, situacion: string) =>
    `${mes} ${anio} · ${focos} focos · ${situacion}`,
  frenteMismoMes: (mes: string) => `Frente a ${mes} de otros años`,
  mesUsual: (mes: string) => `${mes} usual`,
  mesEnCadaAnio: (mes: string) => `${mes} en cada año`,
  notaGraficoAnio: (a: number, b: number) =>
    `Color de cada barra: fuego comparado con el mismo mes en ${a}–${b}. Línea: lo usual de ese mes (mediana).`,
  graficoMesesDe: (anio: number) => `Focos por mes en ${anio}`,
  historicoMismoMes: (a: number, b: number) => `Histórico: el mismo mes, año por año (${a}–${b})`,
  franjaUsual: "franja = lo usual",
  frenteAnioUsual: "Frente a un año usual",
  chipVerAnio: "Ver el año completo",
  chipQuitarNiveles: "Quitar filtro de cantidad",
  soloNiveles: (lista: string) => `Solo ${lista}`,
  mesesSobre: "Meses más altos que lo usual",
  mesesSobreDet: (n: number) => `${n} más bajos`,
  // Map
  preliminarCorto: "preliminar",
  avisoPreliminar:
    "Dato preliminar (casi en tiempo real): puede cambiar cuando NASA publique el definitivo.",
  notaPreliminar: "Borde punteado: dato preliminar, puede cambiar.",
  mapaPreliminar: "Incluye datos preliminares que pueden cambiar.",
  anioIncompleto: "Año incompleto: no se compara.",
  enCurso: "en curso",
  densidadTexto: (d: string) => `${d} por cada 100 km²`,
  mapaResolucion: (fina: boolean): string =>
    fina
      ? "Cuadros de ~11 km (VIIRS, desde 2012)."
      : "Cuadros de ~28 km (estimado con MODIS, 2002–2011): se ve granulado.",
  mapaTitulo: (periodo: string) => `Focos por cada 100 km² · ${periodo}`,
  ayudaMapa: (periodo: string) => [
    "Cada cuadro mide unos 28 km de lado hasta 2011 y unos 11 km desde 2012 (VIIRS ve más detalle).",
    `El color dice cuántos focos de calor hubo ahí en ${periodo} por cada 100 km²: azul, muy pocos; rojo, muchísimos.`,
    "Donde no hay cuadro, no se detectaron focos.",
  ],
  mapaDescripcion:
    "Mapa de focos de calor del Perú en celdas de 28 km. Usa las flechas para moverte y las teclas más y menos para acercarte.",
  cargandoMapa: "Cargando mapa…",
  controlesMapa: "Controles del mapa",
  verPeru: "Ver todo el Perú",
  acercar: "Acercar mapa",
  alejar: "Alejar mapa",
  relieve: "Relieve del terreno",
  coloresAltura: "Colores por altura",
  nivelesMapa: ["Muy pocos", "Pocos", "Moderado", "Muchos", "Muchísimos"],
  comoLeerMapa: "¿Cómo leer el mapa?",
  filtrarNivelesMapa: "Filtrar el mapa por cantidad de focos",
  tooltipCelda: (focos: string, frp?: string) =>
    `${focos} focos equivalentes${frp ? `<br>FRP ${frp} MW` : ""}`,

  // Calendar and dates
  meses,
  mesesCortos: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  /** "6 de octubre" */
  fechaCorta: (f: FechaPartes) => `${f.dia} de ${meses[f.mes]}`,
  /** "6 de octubre de 2026" */
  fechaLarga: (f: FechaPartes) => `${f.dia} de ${meses[f.mes]} de ${f.anio}`,
  /** "octubre 2026" */
  mesAnio: (mes: number, anio: number) => `${meses[mes]} ${anio}`,
};

export type Textos = typeof es;
