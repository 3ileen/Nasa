import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { setWorkerUrl, type ExpressionSpecification, type Map as MapaBase } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { Check, X } from "lucide-react";
import { formatoDecimal, formatoNumero, t } from "@/i18n";
import { useEstado, type Tema } from "@/estado/contexto";
import { CORTES_MAPA, claseMapa, claveDepto, densidad, PERU } from "@/lib/historico";
import {
  departamentoDeCeldas,
  fronteraExterior,
  nombreDepartamento,
  puntoEtiqueta,
  type Limites,
} from "@/lib/geografia";
import { ControlesMapa } from "./ControlesMapa";

setWorkerUrl(workerUrl);

const css = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim();

const ATRIBUCION_RELIEVE =
  'Relieve: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">Terrain Tiles</a> (Mapzen, AWS)';

// Tema: "oscuro" | "claro" (definido en el contexto).

/** Mapa base de OpenFreeMap para cada tema. */
const ESTILO_BASE: Record<Tema, string> = {
  oscuro: "https://tiles.openfreemap.org/styles/dark",
  claro: "https://tiles.openfreemap.org/styles/positron",
};

const alturas = (colores: string[]): ExpressionSpecification => {
  const cotas = [0, 500, 1500, 2500, 3500, 4500, 6000];
  return [
    "interpolate",
    ["linear"],
    ["elevation"],
    -1,
    "rgba(0, 0, 0, 0)", // bajo el nivel del mar: transparente
    ...cotas.flatMap((c, i) => [c, colores[i] ?? "#000000"]),
  ] as ExpressionSpecification;
};

/**
 * Colores por altura (m s. n. m.): 0 costa/llano amazónico · 500 selva baja · 1500 ceja de selva
 * · 2500 valles interandinos · 3500 puna · 4500 alta montaña · 6000 cumbres.
 * Apagados a propósito: sin marrones, naranjas ni amarillos, para no confundirse con el fuego.
 */
const COLORES_ALTURA: Record<Tema, ExpressionSpecification> = {
  oscuro: alturas(["#16241B", "#1C2C21", "#28342A", "#33382F", "#3B3D40", "#47494E", "#5A5C62"]),
  claro: alturas(["#DCE8DD", "#D3E1D4", "#CBD7CB", "#CCD1C8", "#CDCFD3", "#DADCE0", "#F4F5F7"]),
};

const SOMBREADO: Record<Tema, Record<string, string | number>> = {
  oscuro: {
    "hillshade-exaggeration": 0.55,
    "hillshade-shadow-color": "#000000",
    "hillshade-highlight-color": "rgba(255, 255, 255, 0.22)",
    "hillshade-accent-color": "#000000",
  },
  claro: {
    "hillshade-exaggeration": 0.45,
    "hillshade-shadow-color": "#4B5260",
    "hillshade-highlight-color": "rgba(255, 255, 255, 0.6)",
    "hillshade-accent-color": "#4B5260",
  },
};

type CapasRelieve = { sombreado: boolean; colores: boolean };
const vis = (v: boolean) => (v ? "visible" : "none");

/** Agrega (o vuelve a agregar tras cambiar de estilo) el relieve: color por altura y sombreado. */
function agregarRelieve(base: MapaBase, tema: Tema, capas: CapasRelieve) {
  if (!base.getSource("relieve"))
    base.addSource("relieve", {
      type: "raster-dem",
      tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
      encoding: "terrarium",
      tileSize: 256,
      maxzoom: 14,
    });
  const estilo = base.getStyle().layers;
  // Ambas capas van debajo del agua: así el mar y los lagos tapan el relieve del fondo marino,
  // y las vías, límites, etiquetas y focos quedan por encima.
  const antesDelAgua = estilo.find((l) => l.id === "water")?.id ?? estilo[1]?.id;
  // Color por altura (primero) y sombreado encima.
  if (!base.getLayer("relieve-color"))
    base.addLayer(
      {
        id: "relieve-color",
        type: "color-relief",
        source: "relieve",
        layout: { visibility: vis(capas.colores) },
        paint: { "color-relief-color": COLORES_ALTURA[tema] },
      },
      antesDelAgua,
    );
  if (!base.getLayer("relieve"))
    base.addLayer(
      {
        id: "relieve",
        type: "hillshade",
        source: "relieve",
        layout: { visibility: vis(capas.sombreado) },
        paint: SOMBREADO[tema],
      },
      antesDelAgua,
    );
}

/** Colores de la escala del mapa (5 clases), definidos en styles.css para cada tema. */
const VARIABLES_ESCALA = ["--mapa-1", "--mapa-2", "--mapa-3", "--mapa-4", "--mapa-5"];

export default function Mapa() {
  const e = useEstado();
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  /** Halo y línea de departamentos y de la frontera (el halo da contraste sobre cualquier color). */
  const capasLimites = useRef<{
    haloDeps: L.GeoJSON;
    lineaDeps: L.GeoJSON;
    haloFrontera: L.LayerGroup;
    lineaFrontera: L.LayerGroup;
  } | null>(null);
  const [limites, setLimites] = useState<Limites | null>(null);
  const fondo = useRef<MapaBase | null>(null);
  const temaAplicado = useRef<Tema>("oscuro");
  const [relieve, setRelieve] = useState(true);
  const [coloresAltura, setColoresAltura] = useState(true);
  /** Niveles de cantidad visibles en el mapa (0–4). Por defecto todos; se desmarca lo que no se quiere ver. */
  const TODOS_LOS_NIVELES = [0, 1, 2, 3, 4];
  const [nivelesMapa, setNivelesMapa] = useState<number[]>(TODOS_LOS_NIVELES);
  const filtroCantidad = nivelesMapa.length < TODOS_LOS_NIVELES.length;
  const capasRelieve = useRef<CapasRelieve>({ sombreado: relieve, colores: coloresAltura });
  capasRelieve.current = { sombreado: relieve, colores: coloresAltura };
  const ultimo = useRef(e);
  ultimo.current = e;

  const reducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Deja libre el espacio de los paneles abiertos (en pantallas anchas).
  /**
   * Encuadra un área dejando libre el espacio de los paneles abiertos (en pantallas anchas).
   * Todo el Perú usa márgenes fijos (se ve grande aunque el Resumen tape el norte).
   * Un departamento usa el alto real del Resumen y de la leyenda, para no quedar detrás.
   */
  const encuadrar = (b: L.LatLngBounds, esRegion = false) => {
    if (!b.isValid()) return;
    const ancho = window.innerWidth > 900;
    const p = ultimo.current.paneles;
    if (!esRegion) {
      mapa.current?.flyToBounds(b, {
        paddingTopLeft: [ancho && p.anios ? 330 : 40, ancho && p.resumen ? 120 : 40],
        paddingBottomRight: [ancho && p.fechas ? 440 : 70, 90],
        maxZoom: 10,
        duration: reducido() ? 0 : 0.7,
      });
      return;
    }
    // Alto real de lo que tapa el mapa arriba (Resumen) y abajo (leyenda), para no dejar la
    // zona detrás de ellos.
    const cont = mapa.current?.getContainer().getBoundingClientRect();
    const resumen = document.querySelector("#panel-resumen .panel:not([hidden])");
    const leyenda = document.querySelector(".leyenda-mapa")?.getBoundingClientRect();
    if (!cont) return;
    // Bordes del espacio libre (en píxeles del mapa).
    const izq = ancho && p.anios ? 330 : 40;
    const der = cont.width - (ancho && p.fechas ? 440 : 70);
    const arriba =
      ancho && p.resumen && resumen ? resumen.getBoundingClientRect().bottom - cont.top + 16 : 40;
    const leyArriba = leyenda ? leyenda.top - cont.top - 16 : cont.height - 90;
    const leyDer = leyenda ? leyenda.right - cont.left + 16 : izq;
    // Dos huecos posibles: entre el Resumen y la leyenda, o a la derecha de la leyenda.
    // Se usa el más grande, para que el departamento no quede detrás de ningún panel.
    const area = (x0: number, y0: number, x1: number, y1: number) =>
      Math.max(0, x1 - x0) * Math.max(0, y1 - y0);
    const sobre = area(izq, Math.max(40, arriba), der, leyArriba);
    const alLado = area(Math.max(izq, leyDer), Math.max(40, arriba), der, cont.height - 40);
    const [x0, y0, x1, y1] =
      ancho && alLado > sobre
        ? [Math.max(izq, leyDer), Math.max(40, arriba), der, cont.height - 40]
        : [izq, Math.max(40, arriba), der, Math.max(arriba + 120, leyArriba)];
    mapa.current?.flyToBounds(b, {
      paddingTopLeft: [x0, y0],
      paddingBottomRight: [Math.max(20, cont.width - x1), Math.max(20, cont.height - y1)],
      maxZoom: 10,
      duration: reducido() ? 0 : 0.7,
    });
  };
  const verPeru = () => {
    if (limites) encuadrar(L.geoJSON(limites).getBounds());
  };
  /** Departamento elegido (NOMBDEP) o null para todo el Perú. */
  const claveRegion = e.region === PERU ? null : claveDepto(e.region);
  const featureRegion = limites?.features.find((f) => f.properties.NOMBDEP === claveRegion);
  /** Encuadra la región elegida, o todo el Perú. */
  const verRegion = () => {
    if (featureRegion) encuadrar(L.geoJSON(featureRegion).getBounds(), true);
    else verPeru();
  };

  // Crear el mapa una sola vez.
  useEffect(() => {
    if (!elemento.current) return;
    const m = L.map(elemento.current, {
      zoomControl: false,
      preferCanvas: true,
      center: [-9.2, -75],
      zoom: 5,
      minZoom: 3,
      maxZoom: 12,
      keyboard: true,
    });
    mapa.current = m;
    const temaInicial = ultimo.current.tema;
    temaAplicado.current = temaInicial;
    const base = maplibreGL({ style: ESTILO_BASE[temaInicial] }).addTo(m);
    const mlMap = base.getMaplibreMap();
    fondo.current = mlMap;
    // Cada vez que se carga un estilo (al inicio y al cambiar de tema) se vuelve a poner el relieve.
    mlMap.on("style.load", () => agregarRelieve(mlMap, temaAplicado.current, capasRelieve.current));
    // Orden: celdas (420) < límites (430) < nombres de departamentos (440).
    for (const [nombre, z] of [
      ["celdas", "420"],
      ["limites", "430"],
      ["etiquetas", "440"],
    ] as const) {
      const pane = m.createPane(nombre);
      pane.style.zIndex = z;
      if (nombre !== "celdas") pane.style.pointerEvents = "none";
    }
    // Nombres de departamentos solo cuando hay zoom suficiente para leerlos.
    const marcarZoom = () => {
      m.getContainer().dataset["etiquetas"] = m.getZoom() >= 5 ? "si" : "no";
    };
    m.on("zoomend", marcarZoom);
    marcarZoom();
    const cont = m.getContainer();
    cont.setAttribute("role", "region");
    cont.setAttribute("aria-label", t.mapaDescripcion);

    let cancelado = false;
    fetch("/data/departamentos.geojson")
      .then((r) => r.json() as Promise<Limites>)
      .then((g) => {
        if (cancelado) return;
        // Límites de referencia, siempre por encima de los colores (no se eligen).
        const segmentos = fronteraExterior(g);
        const linea = (seg: [number, number][]) =>
          L.polyline(seg, { pane: "limites", interactive: false });
        const capas = {
          haloDeps: L.geoJSON(g, { pane: "limites", interactive: false }),
          haloFrontera: L.layerGroup(segmentos.map(linea)),
          lineaDeps: L.geoJSON(g, { pane: "limites", interactive: false }),
          lineaFrontera: L.layerGroup(segmentos.map(linea)),
        };
        // El orden de alta define qué queda encima: halos abajo, líneas arriba.
        capas.haloDeps.addTo(m);
        capas.haloFrontera.addTo(m);
        capas.lineaDeps.addTo(m);
        capas.lineaFrontera.addTo(m);
        capasLimites.current = capas;
        L.layerGroup(
          g.features
            .filter((f) => f.properties.NOMBDEP !== "CALLAO") // muy pequeño: se superpone con Lima
            .map((f) =>
              L.marker(puntoEtiqueta(f), {
                pane: "etiquetas",
                interactive: false,
                keyboard: false,
                icon: L.divIcon({
                  className: "etiqueta-depto",
                  html: `<span>${nombreDepartamento(f.properties.NOMBDEP)}</span>`,
                  iconSize: [0, 0],
                }),
              }),
            ),
        ).addTo(m);
        setLimites(g);
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
      m.remove();
      mapa.current = null;
    };
  }, []);

  // Idioma: etiqueta accesible del mapa.
  useEffect(() => {
    mapa.current?.getContainer().setAttribute("aria-label", t.mapaDescripcion);
  }, [e.idioma]);

  // Estilo de los límites (depende del tema) y encuadre inicial de todo el Perú.
  const { tema } = e;
  useEffect(() => {
    if (!limites) return;
    const c = capasLimites.current;
    if (!c) return;
    const linea = css("--limite-linea");
    const halo = css("--limite-halo");
    c.haloDeps.setStyle({ color: halo, weight: 3.5, opacity: 0.75, fill: false });
    c.lineaDeps.setStyle({ color: linea, weight: 1.1, opacity: 0.9, fill: false });
    c.haloFrontera.eachLayer((l) =>
      (l as L.Polyline).setStyle({ color: halo, weight: 5.5, opacity: 0.85 }),
    );
    c.lineaFrontera.eachLayer((l) =>
      (l as L.Polyline).setStyle({ color: linea, weight: 2.4, opacity: 1 }),
    );
  }, [limites, tema]);
  // Al cambiar de región: se acerca a ella y se resalta su borde (o vuelve a todo el Perú).
  useEffect(() => {
    const m = mapa.current;
    if (!m || !limites) return;
    verRegion();
    if (!featureRegion) return;
    const borde = L.geoJSON(featureRegion, {
      pane: "limites",
      interactive: false,
      style: { color: css("--primary"), weight: 3, opacity: 1, fill: false },
    }).addTo(m);
    return () => {
      borde.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limites, claveRegion, tema]);

  // Cambio de tema: otro mapa base (el relieve se vuelve a agregar en "style.load").
  useEffect(() => {
    const base = fondo.current;
    if (!base || temaAplicado.current === tema) return;
    temaAplicado.current = tema;
    base.setStyle(ESTILO_BASE[tema], { diff: false });
  }, [tema]);

  // Celdas de 0,25° (~28 km) hasta 2011 y de 0,1° (~11 km) desde 2012; se pinta la densidad
  // (focos por 100 km²) para que todos los años se comparen con la misma escala.
  // El mapa cambia solo con el periodo (año o mes) y con los niveles de cantidad.
  // La comparación con lo usual solo resalta meses en la matriz.
  const { celdasAnio, datos, gran, mes, activas } = e;
  /** Resaltando en la matriz sin un mes elegido: el mapa queda vacío hasta que se elija uno. */
  const eligiendo = activas.length > 0 && gran === "anio";
  const porMes = gran !== "anio";
  const cortes = porMes ? CORTES_MAPA.mes : CORTES_MAPA.anio;
  const celdasBase = datos?.celdas;
  const deptoDeCelda = useMemo(
    () =>
      limites && celdasBase ? departamentoDeCeldas(limites, celdasBase) : new Map<string, string>(),
    [limites, celdasBase],
  );
  useEffect(() => {
    const m = mapa.current;
    if (!m || !datos || !celdasAnio || eligiendo) return;
    if (porMes && !celdasAnio.meses_con_dato[mes - 1]) return;
    const colores = VARIABLES_ESCALA.map(css);
    const grupo = L.layerGroup();
    for (const c of datos.celdas) {
      if (c.tamano !== celdasAnio.tamano_celda) continue; // cada año usa un solo tamaño
      // Solo la región, recortada con el contorno oficial del departamento. (Los "ambitos" del
      // pipeline son un recorte aproximado que incluye bordes de los vecinos: se verían cuadros
      // fuera del departamento.)
      if (claveRegion && deptoDeCelda.get(c.id) !== claveRegion) continue;
      const v = celdasAnio.celdas[c.id];
      if (!v) continue; // ausente = 0
      const valor = porMes ? v.meses[mes - 1] : v.count;
      if (valor === null || valor === undefined) continue;
      const dens = densidad(valor, c);
      const clase = claseMapa(dens, cortes);
      const h = c.tamano / 2;
      if (clase < 0) continue;
      if (!nivelesMapa.includes(clase)) continue; // filtro de la leyenda
      L.rectangle(
        [
          [c.lat - h, c.lon - h],
          [c.lat + h, c.lon + h],
        ],
        {
          pane: "celdas",
          // En modo claro, contorno fino para que amarillo y verde no se pierdan en el fondo claro.
          stroke: tema === "claro",
          weight: 0.5,
          color: "#1F2329",
          opacity: 0.45,
          fillColor: colores[clase] ?? colores[0],
          fillOpacity: 0.85,
        },
      )
        // Por mes no hay FRP por celda: solo se muestra el conteo.
        .bindTooltip(() => {
          const depto = deptoDeCelda.get(c.id);
          const cifras =
            t.tooltipCelda(formatoNumero(valor), porMes ? undefined : formatoNumero(v.frp)) +
            `<br>${t.densidadTexto(formatoDecimal(dens))}`;
          return depto ? `<strong>${nombreDepartamento(depto)}</strong><br>${cifras}` : cifras;
        })
        .addTo(grupo);
    }
    grupo.addTo(m);
    return () => {
      grupo.remove();
    };
  }, [
    celdasAnio,
    datos,
    porMes,
    mes,
    cortes,
    tema,
    deptoDeCelda,
    nivelesMapa,
    eligiendo,
    claveRegion,
  ]);

  // Prender o apagar el sombreado y los colores por altura (cada uno por separado).
  useEffect(() => {
    const base = fondo.current;
    if (base?.getLayer("relieve")) base.setLayoutProperty("relieve", "visibility", vis(relieve));
    if (base?.getLayer("relieve-color"))
      base.setLayoutProperty("relieve-color", "visibility", vis(coloresAltura));
    const atrib = mapa.current?.attributionControl;
    atrib?.removeAttribution(ATRIBUCION_RELIEVE);
    if (relieve || coloresAltura) atrib?.addAttribution(ATRIBUCION_RELIEVE);
  }, [relieve, coloresAltura]);

  const periodoMapa = `${claveRegion ? `${e.nombreRegion} · ` : ""}${
    porMes ? t.mesAnio(mes - 1, e.anio) : String(e.anio)
  }`;
  // Cortes de densidad (pueden tener decimales, p. ej. 2,5).
  const num = (n: number) => (Number.isInteger(n) ? formatoNumero(n) : formatoDecimal(n));
  const rangos = [
    `≤ ${num(cortes[0] ?? 0)}`,
    ...cortes.slice(1).map((c, i) => `${num(cortes[i] ?? 0)}–${num(c)}`),
    `> ${num(cortes.at(-1) ?? 0)}`,
  ];
  const conPreliminar = porMes
    ? !!celdasAnio?.preliminar_meses[mes - 1]
    : !!celdasAnio?.preliminar_meses.some(Boolean);

  return (
    <div className="mapa" data-fechas-abierto={e.paneles.fechas}>
      <div ref={elemento} className="mapa-lienzo" />
      <section className="map-etiqueta leyenda-mapa" aria-labelledby="leyenda-mapa-titulo">
        <div className="chips-mapa" aria-live="polite">
          {eligiendo ? (
            <span className="chip-mapa chip-aviso">{t.eligeMesResaltado}</span>
          ) : (
            <span className="chip-mapa">
              {e.etiquetaPeriodo.charAt(0).toUpperCase() + e.etiquetaPeriodo.slice(1)}
              {porMes && (
                <button
                  type="button"
                  aria-label={t.chipVerAnio}
                  title={t.chipVerAnio}
                  onClick={e.verAnioCompleto}
                >
                  <X size={13} aria-hidden />
                </button>
              )}
            </span>
          )}
          {claveRegion && (
            <span className="chip-mapa">
              {e.nombreRegion}
              <button
                type="button"
                aria-label={t.verPeru}
                title={t.verPeru}
                onClick={() => e.elegirRegion(PERU)}
              >
                <X size={13} aria-hidden />
              </button>
            </span>
          )}
          {filtroCantidad && (
            <span className="chip-mapa">
              {t.soloNiveles(nivelesMapa.map((i) => t.nivelesMapa[i]).join(", "))}
              <button
                type="button"
                aria-label={t.chipQuitarNiveles}
                title={t.chipQuitarNiveles}
                onClick={() => setNivelesMapa(TODOS_LOS_NIVELES)}
              >
                <X size={13} aria-hidden />
              </button>
            </span>
          )}
        </div>
        <h2 id="leyenda-mapa-titulo" className="leyenda-mapa-titulo">
          {t.mapaTitulo(periodoMapa)}
        </h2>
        {/* Cada nivel es también un filtro: sin ninguno marcado se ven todos. */}
        <ol className="leyenda-mapa-escala" aria-label={t.filtrarNivelesMapa}>
          {rangos.map((r, i) => {
            const marcado = nivelesMapa.includes(i);
            const ultimo = marcado && nivelesMapa.length === 1; // siempre queda al menos uno
            return (
              <li key={i}>
                <button
                  type="button"
                  className="nivel-mapa"
                  aria-pressed={marcado}
                  data-activo={marcado}
                  disabled={ultimo}
                  onClick={() =>
                    setNivelesMapa((n) =>
                      n.includes(i) ? n.filter((x) => x !== i) : [...n, i].sort((a, b) => a - b),
                    )
                  }
                >
                  <i style={{ background: `var(${VARIABLES_ESCALA[i]})` }} aria-hidden>
                    {marcado && <Check size={10} strokeWidth={3.5} />}
                  </i>
                  <strong>{t.nivelesMapa[i]}</strong>
                  <span>{r}</span>
                </button>
              </li>
            );
          })}
        </ol>

        {celdasAnio && (
          <p className="map-etiqueta-aviso">{t.mapaResolucion(celdasAnio.tamano_celda < 0.2)}</p>
        )}
        {conPreliminar && <p className="map-etiqueta-aviso">{t.mapaPreliminar}</p>}
        <details className="leyenda-mapa-ayuda">
          <summary>{t.comoLeerMapa}</summary>
          <ul>
            {t.ayudaMapa(periodoMapa).map((linea) => (
              <li key={linea}>{linea}</li>
            ))}
          </ul>
        </details>
      </section>
      <ControlesMapa
        verPeru={verPeru}
        acercar={() => mapa.current?.zoomIn()}
        alejar={() => mapa.current?.zoomOut()}
        relieve={relieve}
        alternarRelieve={() => setRelieve((v) => !v)}
        coloresAltura={coloresAltura}
        alternarColoresAltura={() => setColoresAltura((v) => !v)}
      />
    </div>
  );
}
