import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { t, fechaCorta } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import type { Granularidad } from "@/lib/periodos";
import { CalendarioMes } from "./CalendarioMes";
import { LeyendaFiltro } from "./LeyendaFiltro";
import { PanelFlotante } from "./PanelFlotante";
import { VistaAnual } from "./VistaAnual";

const GRANULARIDADES: Granularidad[] = ["anio", "mes", "semana", "dia"];

export function PanelFechas() {
  const e = useEstado();
  const [verDoce, setVerDoce] = useState(false);
  const anioMax = e.anios.at(-1);
  const anios = e.anios.length ? e.anios : [e.anio];

  return (
    <PanelFlotante
      id="panel-fechas"
      className="panel-fechas"
      titulo={t.fechas}
      resumenCerrado={`${t.fechas} · ${e.etiquetaPeriodo}`}
      abierto={e.paneles.fechas}
      alternar={() => e.alternarPanel("fechas")}
      icono={<CalendarDays size={16} aria-hidden />}
    >
      <label className="form-label" htmlFor="elegir-anio">
        {t.anio}
      </label>
      <select
        id="elegir-anio"
        className="select-field"
        value={e.anio}
        onChange={(ev) => e.elegirAnio(Number(ev.target.value))}
      >
        {anios.map((a) => (
          <option key={a} value={a}>
            {a === anioMax && e.ultimaFecha
              ? `${a} (${t.datosHasta(fechaCorta(e.ultimaFecha))})`
              : a}
          </option>
        ))}
      </select>

      <fieldset className="ver-por">
        <legend className="form-label">{t.verPor}</legend>
        <div className="segmented" role="radiogroup" aria-label={t.verPor}>
          {GRANULARIDADES.map((g) => (
            <label key={g} data-active={e.gran === g}>
              <input
                type="radio"
                name="ver-por"
                value={g}
                checked={e.gran === g}
                onChange={() => e.elegirGran(g)}
                className="sr-only"
              />
              {t.gran[g]}
            </label>
          ))}
        </div>
      </fieldset>

      <CalendarioMes />

      <p className="mostrando" aria-live="polite">
        {t.mostrando}: <strong>{e.etiquetaPeriodo}</strong>
      </p>

      <LeyendaFiltro />

      <label className="casilla">
        <input type="checkbox" checked={verDoce} onChange={(ev) => setVerDoce(ev.target.checked)} />
        {t.verDoce}
      </label>
      {verDoce && <VistaAnual />}
    </PanelFlotante>
  );
}
