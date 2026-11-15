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

// Theme: "oscuro" | "claro" (defined in the context).

/** OpenFreeMap base map for each theme. */
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
    "rgba(0, 0, 0, 0)", // below sea level: transparent
    ...cotas.flatMap((c, i) => [c, colores[i] ?? "#000000"]),
  ] as ExpressionSpecification;
};

/**
 * Colors by elevation (m a.s.l.): 0 coast/Amazon plain · 500 lowland rainforest · 1500 cloud forest
 * · 2500 inter-Andean valleys · 3500 puna · 4500 high mountains · 6000 peaks.
 * Muted on purpose: no browns, oranges or yellows, so they are not confused with fire.
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

/** Adds (or re-adds after a style change) the terrain: color by elevation and hillshade. */
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
  // Both layers go below the water: this way the sea and lakes cover the seabed relief,
  // and roads, boundaries, labels and hotspots stay on top.
  const antesDelAgua = estilo.find((l) => l.id === "water")?.id ?? estilo[1]?.id;
  // Color by elevation (first) and hillshade on top.
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

/** Map scale colors (5 classes), defined in styles.css for each theme. */
const VARIABLES_ESCALA = ["--mapa-1", "--mapa-2", "--mapa-3", "--mapa-4", "--mapa-5"];

export default function Mapa() {
  const e = useEstado();
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  /** Halo and line for departments and the border (the halo gives contrast over any color). */
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
  /** Count levels visible on the map (0–4). All by default; uncheck the ones you do not want to see. */
  const TODOS_LOS_NIVELES = [0, 1, 2, 3, 4];
  const [nivelesMapa, setNivelesMapa] = useState<number[]>(TODOS_LOS_NIVELES);
  const filtroCantidad = nivelesMapa.length < TODOS_LOS_NIVELES.length;
  const capasRelieve = useRef<CapasRelieve>({ sombreado: relieve, colores: coloresAltura });
  capasRelieve.current = { sombreado: relieve, colores: coloresAltura };
  const ultimo = useRef(e);
  ultimo.current = e;

  const reducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Keeps the space of open panels clear (on wide screens).
  /**
   * Fits an area while keeping the space of open panels clear (on wide screens).
   * All of Peru uses fixed margins (it looks large even if the Summary covers the north).
   * A department uses the actual height of the Summary and the legend, so it is not hidden behind them.
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
    // Actual height of what covers the map at the top (Summary) and bottom (legend), so the
    // area does not end up behind them.
    const cont = mapa.current?.getContainer().getBoundingClientRect();
    const resumen = document.querySelector("#panel-resumen .panel:not([hidden])");
    const leyenda = document.querySelector(".leyenda-mapa")?.getBoundingClientRect();
    if (!cont) return;
    // Edges of the free space (in map pixels).
    const izq = ancho && p.anios ? 330 : 40;
    const der = cont.width - (ancho && p.fechas ? 440 : 70);
    const arriba =
      ancho && p.resumen && resumen ? resumen.getBoundingClientRect().bottom - cont.top + 16 : 40;
    const leyArriba = leyenda ? leyenda.top - cont.top - 16 : cont.height - 90;
    const leyDer = leyenda ? leyenda.right - cont.left + 16 : izq;
    // Two possible gaps: between the Summary and the legend, or to the right of the legend.
    // The larger one is used, so the department is not hidden behind any panel.
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
  /** Selected department (NOMBDEP) or null for all of Peru. */
  const claveRegion = e.region === PERU ? null : claveDepto(e.region);
  const featureRegion = limites?.features.find((f) => f.properties.NOMBDEP === claveRegion);
  /** Fits the selected region, or all of Peru. */
  const verRegion = () => {
    if (featureRegion) encuadrar(L.geoJSON(featureRegion).getBounds(), true);
    else verPeru();
  };

  // Create the map only once.
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
    // Every time a style loads (at startup and on theme change) the terrain is added again.
    mlMap.on("style.load", () => agregarRelieve(mlMap, temaAplicado.current, capasRelieve.current));
    // Order: cells (420) < boundaries (430) < department names (440).
    for (const [nombre, z] of [
      ["celdas", "420"],
      ["limites", "430"],
      ["etiquetas", "440"],
    ] as const) {
      const pane = m.createPane(nombre);
      pane.style.zIndex = z;
      if (nombre !== "celdas") pane.style.pointerEvents = "none";
    }
    // Department names only when zoomed in enough to read them.
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
        // Reference boundaries, always above the colors (not selectable).
        const segmentos = fronteraExterior(g);
        const linea = (seg: [number, number][]) =>
          L.polyline(seg, { pane: "limites", interactive: false });
        const capas = {
          haloDeps: L.geoJSON(g, { pane: "limites", interactive: false }),
          haloFrontera: L.layerGroup(segmentos.map(linea)),
          lineaDeps: L.geoJSON(g, { pane: "limites", interactive: false }),
          lineaFrontera: L.layerGroup(segmentos.map(linea)),
        };
        // The order in which they are added defines what stays on top: halos below, lines above.
        capas.haloDeps.addTo(m);
        capas.haloFrontera.addTo(m);
        capas.lineaDeps.addTo(m);
        capas.lineaFrontera.addTo(m);
        capasLimites.current = capas;
        L.layerGroup(
          g.features
            .filter((f) => f.properties.NOMBDEP !== "CALLAO") // very small: overlaps with Lima
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

  // Language: accessible label of the map.
  useEffect(() => {
    mapa.current?.getContainer().setAttribute("aria-label", t.mapaDescripcion);
  }, [e.idioma]);

  // Boundary style (depends on the theme) and initial fit to all of Peru.
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
  // On region change: zoom to it and highlight its border (or go back to all of Peru).
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

  // Theme change: another base map (the terrain is re-added on "style.load").
  useEffect(() => {
    const base = fondo.current;
    if (!base || temaAplicado.current === tema) return;
    temaAplicado.current = tema;
    base.setStyle(ESTILO_BASE[tema], { diff: false });
  }, [tema]);

  // 0.25° cells (~28 km) until 2011 and 0.1° cells (~11 km) from 2012; density is painted
  // (hotspots per 100 km²) so that all years are compared on the same scale.
  // The map only changes with the period (year or month) and the count levels.
  // The comparison with the usual only highlights months in the matrix.
  const { celdasAnio, datos, gran, mes, activas } = e;
  /** Highlighting in the matrix without a selected month: the map stays empty until one is picked. */
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
      if (c.tamano !== celdasAnio.tamano_celda) continue; // each year uses a single size
      // Only the region, clipped with the official department outline. (The pipeline's "ambitos"
      // are an approximate clip that includes edges of the neighbors: squares would show up
      // outside the department.)
      if (claveRegion && deptoDeCelda.get(c.id) !== claveRegion) continue;
      const v = celdasAnio.celdas[c.id];
      if (!v) continue; // missing = 0
      const valor = porMes ? v.meses[mes - 1] : v.count;
      if (valor === null || valor === undefined) continue;
      const dens = densidad(valor, c);
      const clase = claseMapa(dens, cortes);
      const h = c.tamano / 2;
      if (clase < 0) continue;
      if (!nivelesMapa.includes(clase)) continue; // legend filter
      L.rectangle(
        [
          [c.lat - h, c.lon - h],
          [c.lat + h, c.lon + h],
        ],
        {
          pane: "celdas",
          // In light mode, a thin outline so yellow and green do not get lost on the light background.
          stroke: tema === "claro",
          weight: 0.5,
          color: "#1F2329",
          opacity: 0.45,
          fillColor: colores[clase] ?? colores[0],
          fillOpacity: 0.85,
        },
      )
        // Per month there is no FRP per cell: only the count is shown.
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

  // Turn the hillshade and the elevation colors on or off (each one separately).
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
  // Density breaks (may have decimals, e.g. 2.5).
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
        {/* Each level is also a filter: with none checked, all are shown. */}
        <ol className="leyenda-mapa-escala" aria-label={t.filtrarNivelesMapa}>
          {rangos.map((r, i) => {
            const marcado = nivelesMapa.includes(i);
            const ultimo = marcado && nivelesMapa.length === 1; // at least one always remains
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
