import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { t } from "@/i18n";
import { ProveedorEstado } from "@/estado/Estado";
import { useEstado } from "@/estado/contexto";
import { MenuSuperior } from "@/components/MenuSuperior";
import { PanelPeriodo } from "@/components/PanelPeriodo";
import { PanelResumen } from "@/components/PanelResumen";
import { PanelMatriz } from "@/components/PanelMatriz";

// Leaflet, Geoman y MapLibre solo en el navegador (no en SSR).
const Mapa = lazy(() => import("@/components/Mapa"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Focos de calor del Perú | Junior FC" },
      {
        name: "description",
        content:
          "Calendario histórico de focos de calor del Perú, 2002–2026: MODIS y VIIRS en una sola serie, comparado con lo normal.",
      },
      { property: "og:title", content: "Focos de calor del Perú" },
      {
        property: "og:description",
        content:
          "MODIS + VIIRS en una sola serie: calendario, ranking y mapa de focos de calor del Perú.",
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
