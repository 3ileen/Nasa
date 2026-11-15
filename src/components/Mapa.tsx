import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import { setWorkerUrl, type ExpressionSpecification, type Map as MapaBase } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { Check, Undo2 } from "lucide-react";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { t, fechaLarga, formatoDecimal } from "@/i18n";
import { useEstado, type Tema } from "@/estado/contexto";
import { nombreDepartamento } from "@/lib/departamentos";
import { VARIABLE_NIVEL, type Nivel } from "@/lib/niveles";
import { ControlesMapa } from "./ControlesMapa";

setWorkerUrl(workerUrl);

type Limites = FeatureCollection<Polygon | MultiPolygon, { NOMBDEP: string }>;

const css = (token: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(token).trim();
/** Radio fijo de 2,5 a 4,5 px según el zoom. */
const radioPara = (zoom: number) => Math.max(2.5, Math.min(4.5, 2.5 + (zoom - 5) * 0.5));

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

export default function Mapa() {
  const e = useEstado();
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capaDeps = useRef<L.GeoJSON | null>(null);
  const capaFocos = useRef<L.LayerGroup | null>(null);
  const dibujado = useRef<L.Polygon | null>(null);
  const [limites, setLimites] = useState<Limites | null>(null);
  const fondo = useRef<MapaBase | null>(null);
  const temaAplicado = useRef<Tema>("oscuro");
  const [relieve, setRelieve] = useState(true);
  const [coloresAltura, setColoresAltura] = useState(true);
  const capasRelieve = useRef<CapasRelieve>({ sombreado: relieve, colores: coloresAltura });
  capasRelieve.current = { sombreado: relieve, colores: coloresAltura };
  const ultimo = useRef(e);
  ultimo.current = e;

  const reducido = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Deja libre el espacio de los paneles abiertos (en pantallas anchas).
  const encuadrar = (b: L.LatLngBounds) => {
    if (!b.isValid()) return;
    const ancho = window.innerWidth > 900;
    const p = ultimo.current.paneles;
    mapa.current?.flyToBounds(b, {
      paddingTopLeft: [ancho && p.area ? 330 : 40, ancho && p.resumen ? 120 : 40],
      paddingBottomRight: [ancho && p.fechas ? 392 : 70, 80],
      maxZoom: 10,
      duration: reducido() ? 0 : 0.7,
    });
  };
  const verPeru = () => {
    if (limites) encuadrar(L.geoJSON(limites).getBounds());
  };
  const irArea = () => {
    const a = ultimo.current.area;
    if (a.modo === "dibujo") {
      if (a.poligono) encuadrar(L.geoJSON(a.poligono).getBounds());
      return;
    }
    if (!limites || !a.departamentos.length) return;
    const features = limites.features.filter((f) => a.departamentos.includes(f.properties.NOMBDEP));
    encuadrar(L.geoJSON({ type: "FeatureCollection", features } as Limites).getBounds());
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
      maxZoom: 16,
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
    m.createPane("focos");
    const pane = m.getPane("focos");
    if (pane) pane.style.zIndex = "450";
    m.pm.setLang("es");
    m.on("pm:create", (ev) => {
      const creado = (ev as unknown as { layer: L.Polygon }).layer;
      dibujado.current = creado;
      creado.pm.disable();
      const g = creado.toGeoJSON().geometry;
      if (g.type === "Polygon") ultimo.current.fijarPoligono(g);
    });
    m.on("zoomend", () => {
      const r = radioPara(m.getZoom());
      capaFocos.current?.eachLayer((l) => (l as L.CircleMarker).setRadius(r));
    });
    const cont = m.getContainer();
    cont.setAttribute("role", "region");
    cont.setAttribute("aria-label", t.mapaDescripcion);

    let cancelado = false;
    fetch("/data/departamentos.geojson")
      .then((r) => r.json() as Promise<Limites>)
      .then((g) => {
        if (cancelado) return;
        capaDeps.current = L.geoJSON(g, {
          onEachFeature: (f, capa) => {
            capa.bindTooltip(nombreDepartamento(f.properties.NOMBDEP), { sticky: true });
            capa.on("click", () => {
              if (ultimo.current.area.modo === "departamentos")
                ultimo.current.alternarDepartamento(f.properties.NOMBDEP);
            });
          },
        }).addTo(m);
        setLimites(g);
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
      m.remove();
      mapa.current = null;
    };
  }, []);

  // Estilo de los departamentos elegidos + encuadre automático al cambiar el área.
  // Al cambiar de idioma: etiqueta del mapa y textos de ayuda de Geoman (solo tiene es/en).
  useEffect(() => {
    mapa.current?.getContainer().setAttribute("aria-label", t.mapaDescripcion);
    mapa.current?.pm.setLang(e.idioma === "en" ? "en" : "es");
  }, [e.idioma]);

  const { area, tema } = e;
  useEffect(() => {
    if (!limites) return;
    capaDeps.current?.setStyle((f) => {
      const elegido =
        area.modo === "departamentos" && !!f && area.departamentos.includes(f.properties.NOMBDEP);
      return {
        color: css(elegido ? "--primary" : "--map-border"),
        weight: elegido ? 1.8 : 1,
        dashArray: elegido ? "5 5" : "",
        fillColor: css(elegido ? "--primary" : "--card"),
        fillOpacity: elegido ? 0.1 : 0.13,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limites, area, tema]);

  // Encuadre automático solo cuando cambia el área.
  useEffect(() => {
    if (limites) irArea();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limites, area]);

  // Cambio de tema: otro mapa base (el relieve se vuelve a agregar en "style.load").
  useEffect(() => {
    const base = fondo.current;
    if (!base || temaAplicado.current === tema) return;
    temaAplicado.current = tema;
    base.setStyle(ESTILO_BASE[tema], { diff: false });
  }, [tema]);

  // Focos: CircleMarker con el color del nivel de su día.
  const { focosVisibles, niveles } = e;
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    const colores = Object.fromEntries(
      Object.entries(VARIABLE_NIVEL).map(([n, v]) => [n, css(v)]),
    ) as Record<Nivel, string>;
    const grupo = L.layerGroup();
    const r = radioPara(m.getZoom());
    for (const f of focosVisibles) {
      L.circleMarker([f.lat, f.lon], {
        pane: "focos",
        radius: r,
        // En modo claro, borde fino para que el amarillo se vea sobre fondo claro.
        weight: tema === "claro" ? 0.8 : 0,
        color: "#1F2329",
        opacity: 0.7,
        fillColor: colores[niveles.get(f.fecha) ?? 1],
        fillOpacity: 0.9,
      })
        .bindTooltip(() =>
          t.tooltipFoco(
            fechaLarga(f.fecha),
            formatoDecimal(f.peso),
            formatoDecimal(f.frp),
            t.confianzaValores[f.confianza] ?? f.confianza,
          ),
        )
        .addTo(grupo);
    }
    grupo.addTo(m);
    capaFocos.current = grupo;
    return () => {
      grupo.remove();
      capaFocos.current = null;
    };
  }, [focosVisibles, niveles, tema]);

  // Dibujo con Geoman (sin barra de herramientas).
  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    m.pm.disableDraw();
    if (dibujado.current && (area.modo === "departamentos" || !area.poligono)) {
      m.removeLayer(dibujado.current);
      dibujado.current = null;
    }
    if (area.modo === "dibujo" && !area.poligono) {
      const color = css("--primary");
      m.pm.enableDraw("Polygon", {
        snappable: false,
        allowSelfIntersection: false,
        templineStyle: { color },
        hintlineStyle: { color, dashArray: "5 5" },
        pathOptions: { color, fillOpacity: 0.12 },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [area.modo, area.poligono === null, e.dibujoVersion]);

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

  const herramienta = () =>
    mapa.current?.pm.Draw["Polygon"] as unknown as
      { _removeLastVertex: () => void; _finishShape: () => void } | undefined;
  const dibujando = area.modo === "dibujo" && !area.poligono;

  return (
    <div className="mapa" data-fechas-abierto={e.paneles.fechas} data-dibujando={dibujando}>
      <div ref={elemento} className="mapa-lienzo" />
      {dibujando && (
        <div className="map-draw-controls">
          <button
            type="button"
            className="boton-mapa con-texto"
            onClick={() => herramienta()?._removeLastVertex()}
          >
            <Undo2 aria-hidden size={16} />
            {t.deshacer}
          </button>
          <button
            type="button"
            className="boton-principal"
            onClick={() => herramienta()?._finishShape()}
          >
            <Check aria-hidden size={16} />
            {t.listo}
          </button>
        </div>
      )}
      <div className="map-etiqueta">{t.enMapa(focosVisibles.length, e.etiquetaPeriodo)}</div>
      <ControlesMapa
        verPeru={verPeru}
        irArea={irArea}
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
