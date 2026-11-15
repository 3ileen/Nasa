import { Grid3x3, X } from "lucide-react";
import { t } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { LeyendaMatriz } from "./LeyendaMatriz";
import { MatrizHistorica } from "./MatrizHistorica";
import { PanelFlotante } from "./PanelFlotante";

/** Toda la serie junta: años × meses. También sirve para elegir el periodo. */
export function PanelMatriz() {
  const e = useEstado();
  return (
    <PanelFlotante
      id="panel-fechas"
      className="panel-fechas"
      titulo={t.todosLosAnios}
      resumenCerrado={t.todosLosAnios}
      abierto={e.paneles.fechas}
      alternar={() => e.alternarPanel("fechas")}
      icono={<Grid3x3 size={16} aria-hidden />}
    >
      <div className="matriz-barra">
        <p className="ayuda-matriz">{t.ayudaMatriz}</p>
        {e.activas.length > 0 && (
          <button type="button" className="boton-limpiar" onClick={e.limpiarCategorias}>
            <X size={14} aria-hidden />
            {t.limpiarFiltros}
          </button>
        )}
      </div>
      <MatrizHistorica />
      <p className="nota-tramo">
        <i className="muestra-estimado" aria-hidden />
        {t.estimadoAqua}
      </p>
      <p className="nota-tramo">
        <i className="muestra-preliminar" aria-hidden />
        {t.notaPreliminar}
      </p>
      <LeyendaMatriz />
    </PanelFlotante>
  );
}
