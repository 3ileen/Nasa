import { useState } from "react";
import { Download, Globe2, MapPin, Pencil, RotateCcw, Search, X } from "lucide-react";
import { t, formatoNumero } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { DEPARTAMENTOS, nombreDepartamento, sinTildes } from "@/lib/departamentos";
import { aCsv } from "@/lib/datos";
import { PanelFlotante } from "./PanelFlotante";

export function PanelArea() {
  const e = useEstado();
  const [busqueda, setBusqueda] = useState("");
  const { area } = e;
  const opciones = DEPARTAMENTOS.filter((d) =>
    sinTildes(nombreDepartamento(d)).includes(sinTildes(busqueda.trim())),
  );
  const todos = area.departamentos.length === DEPARTAMENTOS.length;

  const descargar = () => {
    const blob = new Blob(["﻿" + aCsv(e.focosVisibles)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      `focos_${e.etiquetaArea}_${e.etiquetaPeriodo}`.replace(/[^\p{L}\p{N}]+/gu, "_") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PanelFlotante
      id="panel-area"
      className="panel-area"
      titulo={t.area}
      resumenCerrado={`${t.areaCorta} · ${e.etiquetaArea}`}
      abierto={e.paneles.area}
      alternar={() => e.alternarPanel("area")}
      icono={<MapPin size={16} aria-hidden />}
    >
      <div className="segmented" role="group" aria-label={t.area}>
        <button
          type="button"
          aria-pressed={area.modo === "departamentos"}
          data-active={area.modo === "departamentos"}
          onClick={() => e.elegirModo("departamentos")}
        >
          {t.departamentos}
        </button>
        <button
          type="button"
          aria-pressed={area.modo === "dibujo"}
          data-active={area.modo === "dibujo"}
          onClick={() => e.elegirModo("dibujo")}
        >
          <Pencil size={14} aria-hidden />
          {t.dibujar}
        </button>
      </div>

      {area.modo === "departamentos" ? (
        <>
          <div className="search-wrap">
            <Search size={15} aria-hidden />
            <label className="sr-only" htmlFor="buscar-departamento">
              {t.buscar}
            </label>
            <input
              id="buscar-departamento"
              type="search"
              placeholder={t.buscarPlaceholder}
              value={busqueda}
              onChange={(ev) => setBusqueda(ev.target.value)}
            />
          </div>
          <div className="selection-actions">
            <button
              type="button"
              onClick={() => e.fijarDepartamentos([...DEPARTAMENTOS])}
              disabled={todos}
            >
              <Globe2 size={13} aria-hidden />
              {t.todoPeru}
            </button>
            <button
              type="button"
              onClick={() => e.fijarDepartamentos([])}
              disabled={!area.departamentos.length}
            >
              {t.quitarTodos}
            </button>
          </div>
          <fieldset className="department-list">
            <legend className="sr-only">
              {t.departamentos}. {t.totalAnual(e.anio)}
            </legend>
            {opciones.map((d) => (
              <label className="department-option" key={d}>
                <input
                  type="checkbox"
                  checked={area.departamentos.includes(d)}
                  onChange={() => e.alternarDepartamento(d)}
                />
                <span className="department-name">{nombreDepartamento(d)}</span>
                <span className="department-total" title={t.totalAnual(e.anio)}>
                  {formatoNumero(e.totalesDepartamento[d] ?? 0)}
                </span>
              </label>
            ))}
            {!opciones.length && <p className="empty-text">{t.sinResultados}</p>}
          </fieldset>
          <div className="chips" aria-label={t.elegidos(area.departamentos.length)}>
            {todos ? (
              <span className="chip">
                {t.todoPeru}
                <button
                  type="button"
                  aria-label={t.quitar(t.todoPeru)}
                  onClick={() => e.fijarDepartamentos([])}
                >
                  <X size={12} aria-hidden />
                </button>
              </span>
            ) : (
              area.departamentos.map((d) => (
                <span className="chip" key={d}>
                  {nombreDepartamento(d)}
                  <button
                    type="button"
                    aria-label={t.quitar(nombreDepartamento(d))}
                    onClick={() => e.alternarDepartamento(d)}
                  >
                    <X size={12} aria-hidden />
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="selection-count">{t.elegidos(area.departamentos.length)}</div>
        </>
      ) : (
        <>
          {!area.poligono && <p className="draw-help">{t.ayudaDibujo}</p>}
          <button type="button" className="boton-secundario" onClick={e.redibujar}>
            <RotateCcw size={15} aria-hidden />
            {t.redibujar}
          </button>
        </>
      )}

      <div className="descarga">
        <button
          type="button"
          className="boton-principal"
          onClick={descargar}
          disabled={!e.focosVisibles.length}
        >
          <Download size={16} aria-hidden />
          {t.descargar}
        </button>
      </div>
    </PanelFlotante>
  );
}
