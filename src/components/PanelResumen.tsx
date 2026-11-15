import { ArrowDownRight, ArrowUpRight, BarChart3 } from "lucide-react";
import type { ReactNode } from "react";
import { t, fechaCorta, formatoDecimal, formatoNumero, formatoPct } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { nombreDepartamento } from "@/lib/departamentos";
import type { Barra, Cambio } from "@/lib/indicadores";
import { duracion, recortar } from "@/lib/periodos";
import { PanelFlotante } from "./PanelFlotante";

function Indicador({
  titulo,
  valor,
  detalle,
}: {
  titulo: string;
  valor: ReactNode;
  detalle?: ReactNode;
}) {
  return (
    <div className="indicador">
      <div className="indicador-titulo">{titulo}</div>
      <div className="indicador-valor">{valor}</div>
      {detalle && <div className="indicador-detalle">{detalle}</div>}
    </div>
  );
}

function ValorCambio({ cambio }: { cambio: Cambio }) {
  if (cambio.tipo === "sinDatos") return <span className="indicador-vacio">{t.sinAnterior}</span>;
  if (cambio.tipo === "anteriorCero")
    return <span className="indicador-vacio">{t.anteriorCero}</span>;
  const v = Math.round(cambio.valor);
  const sube = v > 0;
  const Icono = sube ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={v === 0 ? "" : sube ? "cambio-sube" : "cambio-baja"}>
      {v !== 0 && <Icono size={16} aria-hidden />}
      {sube ? "+" : ""}
      {formatoPct(v)}
      <span className="sr-only"> ({v >= 0 ? t.subio : t.bajo})</span>
    </span>
  );
}

function GraficoBarras({ barras, porMes }: { barras: Barra[]; porMes: boolean }) {
  const max = Math.max(1, ...barras.map((b) => b.total));
  const titulo = porMes ? t.graficoMes : t.graficoDia;
  const etiqueta = (b: Barra) =>
    porMes ? (t.meses[Number(b.clave.slice(5, 7)) - 1] ?? "") : fechaCorta(b.clave);
  const pico = barras.reduce<Barra | null>((m, b) => (!m || b.total > m.total ? b : m), null);
  return (
    <figure className="grafico">
      <figcaption className="grafico-titulo">{titulo}</figcaption>
      <div
        className="grafico-barras"
        role="img"
        aria-label={`${titulo}. ${pico && pico.total > 0 ? `${t.maximo}: ${etiqueta(pico)}, ${formatoNumero(pico.total)} ${t.focosEq}.` : t.sinFocos}`}
        style={{ gridTemplateColumns: `repeat(${barras.length}, minmax(0, 1fr))` }}
      >
        {barras.map((b) => (
          <div
            key={b.clave}
            className="grafico-columna"
            data-sin-datos={b.sinDatos}
            title={`${etiqueta(b)}: ${b.sinDatos ? t.sinDatosTodavia : `${formatoNumero(b.total)} ${t.focosEq}`}`}
          >
            <div className="grafico-pila" style={{ height: `${(b.total / max) * 100}%` }}>
              {([4, 3, 2, 1] as const).map((n) =>
                b.porNivel[n] > 0 ? (
                  <span
                    key={n}
                    className={`grafico-segmento level-${n}`}
                    style={{ flexGrow: b.porNivel[n] }}
                  />
                ) : null,
              )}
            </div>
          </div>
        ))}
      </div>
      {porMes && (
        <div
          className="grafico-ejes"
          aria-hidden
          style={{ gridTemplateColumns: `repeat(${barras.length}, minmax(0, 1fr))` }}
        >
          {t.mesesCortos.map((m) => (
            <span key={m}>{m.slice(0, 1).toUpperCase()}</span>
          ))}
        </div>
      )}
    </figure>
  );
}

export function PanelResumen() {
  const e = useEstado();
  const r = e.resumen;
  const sinArea = e.area.modo === "departamentos" ? !e.area.departamentos.length : !e.area.poligono;
  const titulo = `${e.etiquetaArea} · ${e.etiquetaPeriodo}`;
  const diasComparados = duracion(recortar(e.periodo, e.ultimaFecha));

  let cuerpo: ReactNode;
  if (e.error)
    cuerpo = (
      <p className="resumen-mensaje">
        {t.errorDatos} ({e.error})
      </p>
    );
  else if (sinArea)
    cuerpo = (
      <p className="resumen-mensaje">{e.area.modo === "dibujo" ? t.dibujaArea : t.eligeArea}</p>
    );
  else if (e.cargando && !r.detecciones) cuerpo = <p className="resumen-mensaje">{t.cargando}</p>;
  else
    cuerpo = (
      <>
        <div className="indicadores">
          <Indicador
            titulo={t.diaMax}
            valor={r.diaMax ? fechaCorta(r.diaMax.fecha) : "—"}
            detalle={r.diaMax ? `${formatoNumero(r.diaMax.total)} ${t.focosEq}` : undefined}
          />
          {e.gran === "anio" ? (
            <Indicador
              titulo={t.mesMax}
              valor={r.mesMax ? <span className="capitalize">{t.meses[r.mesMax.mes]}</span> : "—"}
              detalle={r.mesMax ? `${formatoNumero(r.mesMax.total)} ${t.focosEq}` : undefined}
            />
          ) : (
            r.cambio && (
              <Indicador
                titulo={t.vsAnterior}
                valor={<ValorCambio cambio={r.cambio} />}
                detalle={t.mismosDias(diasComparados)}
              />
            )
          )}
          <Indicador
            titulo={t.frpMax}
            valor={r.frpMax ? `${formatoDecimal(r.frpMax.frp)} MW` : "—"}
            detalle={
              r.frpMax
                ? `${nombreDepartamento(r.frpMax.departamento)} · ${fechaCorta(r.frpMax.fecha)}`
                : undefined
            }
          />
          <Indicador
            titulo={t.confianzaAlta}
            valor={r.pctAlta === null ? "—" : formatoPct(r.pctAlta)}
            detalle={t.delasDetecciones}
          />
          <Indicador
            titulo={t.deNoche}
            valor={r.pctNoche === null ? "—" : formatoPct(r.pctNoche)}
            detalle={t.delasDetecciones}
          />
          {r.depTop && (
            <Indicador
              titulo={t.depTop}
              valor={nombreDepartamento(r.depTop.departamento)}
              detalle={`${formatoPct(r.depTop.pct)} ${t.delTotal}`}
            />
          )}
        </div>
        {e.gran !== "dia" && <GraficoBarras barras={r.barras} porMes={e.gran === "anio"} />}
        <p className="resumen-nota">{t.notaEquivalentes}</p>
      </>
    );

  return (
    <PanelFlotante
      id="panel-resumen"
      className="panel-resumen"
      titulo={t.resumen}
      tituloOculto
      resumenCerrado={`${t.resumen} · ${formatoNumero(r.total)} ${t.focosEq}`}
      abierto={e.paneles.resumen}
      alternar={() => e.alternarPanel("resumen")}
      icono={<BarChart3 size={16} aria-hidden />}
    >
      <div aria-live="polite" aria-atomic="true" className="resumen-cabecera">
        <div className="resumen-area">{titulo}</div>
        {!sinArea && !e.error && (
          <div className="resumen-total">
            <span className="resumen-numero">{formatoNumero(r.total)}</span> {t.focosEq}{" "}
            <span className="resumen-detecciones">({t.detecciones(r.detecciones)})</span>
          </div>
        )}
      </div>
      {cuerpo}
    </PanelFlotante>
  );
}
