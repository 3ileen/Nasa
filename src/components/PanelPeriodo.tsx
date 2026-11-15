import Papa from "papaparse";
import { CalendarDays, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { t } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { filasCsv } from "@/lib/historico";
import { PanelFlotante } from "./PanelFlotante";

/** Forma simple de elegir el periodo: un año y un mes (o el año completo). Sincronizado con la matriz. */
export function PanelPeriodo() {
  const e = useEstado();
  const i = e.anios.indexOf(e.anio);
  const tramoDe = (a: number) => e.datos?.ranking.find((r) => r.anio === a)?.tramo;

  const descargar = () => {
    const csv = Papa.unparse(filasCsv(e.mesesAnio));
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `focos_peru_${e.anio}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PanelFlotante
      id="panel-anios"
      className="panel-anios"
      titulo={t.periodo}
      resumenCerrado={`${t.periodo} · ${e.etiquetaPeriodo}`}
      abierto={e.paneles.anios}
      alternar={() => e.alternarPanel("anios")}
      icono={<CalendarDays size={16} aria-hidden />}
    >
      <label className="form-label" htmlFor="elegir-anio">
        {t.anio}
      </label>
      <div className="anio-sel">
        <button
          type="button"
          className="boton-icono"
          aria-label={t.anioAnterior}
          title={t.anioAnterior}
          disabled={i <= 0}
          onClick={() => e.elegirAnio(e.anios[i - 1] ?? e.anio)}
        >
          <ChevronLeft aria-hidden size={18} />
        </button>
        <select
          id="elegir-anio"
          className="select-field"
          value={e.anio}
          onChange={(ev) => e.elegirAnio(Number(ev.target.value))}
        >
          {[...e.anios].reverse().map((a) => (
            <option key={a} value={a}>
              {tramoDe(a) === "estimado" ? `${a} (${t.tramo.estimado})` : a}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="boton-icono"
          aria-label={t.anioSiguiente}
          title={t.anioSiguiente}
          disabled={i < 0 || i >= e.anios.length - 1}
          onClick={() => e.elegirAnio(e.anios[i + 1] ?? e.anio)}
        >
          <ChevronRight aria-hidden size={18} />
        </button>
      </div>

      <fieldset className="mes-sel">
        <legend className="form-label">{t.mesEtiqueta}</legend>
        <button
          type="button"
          className="boton-todo-anio"
          aria-pressed={e.gran === "anio"}
          onClick={e.verAnioCompleto}
        >
          {t.todoElAnio}
        </button>
        <div className="meses-sel">
          {t.mesesCortos.map((nombre, idx) => {
            const elegido = e.gran === "mes" && e.mes === idx + 1;
            const disponible = !!e.mesesAnio[idx];
            return (
              <button
                type="button"
                key={nombre}
                className="boton-mes"
                aria-pressed={elegido}
                aria-label={t.mesAnio(idx, e.anio)}
                disabled={!disponible}
                onClick={() => e.elegirMes(idx + 1)}
              >
                {nombre}
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="sincronizado">
        <i aria-hidden />
        {t.sincronizado}
      </p>

      <div className="descarga">
        <button
          type="button"
          className="boton-principal"
          onClick={descargar}
          disabled={!e.mesesAnio.some(Boolean)}
        >
          <Download size={16} aria-hidden />
          {t.descargar}
        </button>
      </div>
    </PanelFlotante>
  );
}
