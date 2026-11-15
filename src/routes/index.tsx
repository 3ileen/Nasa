import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { t } from "@/i18n";
import { ProveedorEstado } from "@/estado/Estado";
import { useEstado } from "@/estado/contexto";
import { MenuSuperior } from "@/components/MenuSuperior";
import { PanelPeriodo } from "@/components/PanelPeriodo";
import { PanelResumen } from "@/components/PanelResumen";
import { PanelMatriz } from "@/components/PanelMatriz";

// Leaflet and MapLibre run only in the browser (not during SSR).
const Mapa = lazy(() => import("@/components/Mapa"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NinaWillay · Fire hotspots in Peru" },
      {
        name: "description",
        content:
          "Historical calendar of fire hotspots in Peru, 2002–2026: MODIS and VIIRS in a single series, compared with the usual.",
      },
      { property: "og:title", content: "NinaWillay · Fire hotspots in Peru" },
      {
        property: "og:description",
        content:
          "MODIS + VIIRS in a single series: calendar, ranking and map of fire hotspots in Peru.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ProveedorEstado>
      <Aplicacion />
    </ProveedorEstado>
  );
}

function Aplicacion() {
  const { escala, paneles } = useEstado();
  const cargando = <div className="mapa mapa-cargando">{t.cargandoMapa}</div>;
  return (
    <div
      className={`app-root ${escala === 1 ? "text-115" : escala === 2 ? "text-130" : ""}`}
      data-anios-abierto={paneles.anios}
      data-fechas-abierto={paneles.fechas}
      data-resumen-abierto={paneles.resumen}
    >
      <MenuSuperior />
      <main className="escenario">
        <ClientOnly fallback={cargando}>
          <Suspense fallback={cargando}>
            <Mapa />
          </Suspense>
        </ClientOnly>
        <PanelPeriodo />
        <PanelResumen />
        <PanelMatriz />
      </main>
    </div>
  );
}
