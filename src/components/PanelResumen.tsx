import type { ReactNode } from "react";
import { AlertTriangle, BarChart3 } from "lucide-react";
import {
  formatoCompacto,
  formatoDecimal,
  formatoNumero,
  formatoPct,
  formatoPctSigno,
  t,
} from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { resumenMeses, type CategoriaId, type Mes } from "@/lib/historico";
import { colorCategoria, nombreCalidad, nombreCategoria, nombreFuente } from "./anomalia";
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

/** % frente a lo normal: rojo si hay más fuego, verde si hay menos. */
function Diferencia({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="indicador-vacio">{t.sinDato}</span>;
  return (
    <span className={pct > 0 ? "cambio-sube" : pct < 0 ? "cambio-baja" : ""}>
      {formatoPctSigno(pct)}
    </span>
  );
}

type Barra = {
  clave: string;
  etiqueta: string;
  valor: number | null;
  mediana: number;
  cat: CategoriaId;
  estimado: boolean;
  resaltada: boolean;
};

function Grafico({
  titulo,
  barras,
  ejes,
  eje,
  nota,
}: {
  titulo: string;
  barras: Barra[];
  ejes?: string[];
  /** Nombre del eje horizontal (p. ej. "Mes"). */
  eje?: string;
  /** Qué significan el color y la línea. */
  nota?: string | undefined;
}) {
  const e = useEstado();
  const meta = e.datos?.meta;
  const max = Math.max(1, ...barras.map((b) => Math.max(b.valor ?? 0, b.mediana)));
  const pico = barras.reduce<Barra | null>(
    (m, b) => ((b.valor ?? -1) > (m?.valor ?? -1) ? b : m),
    null,
  );
  const columnas = { gridTemplateColumns: `repeat(${barras.length}, minmax(0, 1fr))` };
  const algunaResaltada = barras.some((b) => b.resaltada);
  return (
    <figure className="grafico">
      <figcaption className="grafico-titulo">
        {titulo}
        <span className="grafico-leyenda" aria-hidden>
          <i className="marca-mediana" /> {t.medianaLeyenda}
        </span>
      </figcaption>
      <div
        className="grafico-barras"
        role="img"
        aria-label={`${titulo}. ${pico && pico.valor !== null ? `${t.maximo}: ${pico.etiqueta}, ${formatoNumero(pico.valor)} ${t.focosEq}.` : ""}`}
        style={columnas}
      >
        {barras.map((b) => (
          <div
            key={b.clave}
            className="grafico-columna"
            data-sin-datos={b.valor === null}
            data-atenuada={algunaResaltada && !b.resaltada}
            title={`${b.etiqueta}: ${b.valor === null ? t.sinDato : `${formatoNumero(b.valor)} ${t.focosEq}`} · ${nombreCategoria(b.cat)}`}
          >
            {b.valor !== null && (
              <div
                className="grafico-pila"
                data-estimado={b.estimado}
                data-atenuada={!e.categoriaVisible(b.cat)}
                style={{
                  height: `${(b.valor / max) * 100}%`,
                  backgroundColor: colorCategoria(meta, b.cat),
                }}
              />
            )}
            <i
              className="marca-mediana"
              style={{ bottom: `${(b.mediana / max) * 100}%` }}
              aria-hidden
            />
          </div>
        ))}
      </div>
      {ejes && (
        <div className="grafico-ejes" aria-hidden style={columnas}>
          {ejes.map((x, i) => (
            <span key={i}>{x}</span>
          ))}
        </div>
      )}
      {eje && <div className="grafico-eje-titulo">{eje} →</div>}
      {nota && <p className="grafico-nota">{nota}</p>}
    </figure>
  );
}

const barraMes = (m: Mes, resaltada: boolean): Barra => ({
  clave: `${m.anio}-${m.mes}`,
  etiqueta: t.mesAnio(m.mes - 1, m.anio),
  valor: m.count,
  mediana: m.mediana,
  cat: m.cat,
  estimado: m.tramo === "estimado",
  resaltada,
});
/**
 * El mes elegido en cada año (2002–2024), con la franja de lo usual (p25–p75).
 * Deja claro que la comparación es contra el mismo mes de otros años.
 */
function MismoMesCadaAnio({ mes, titulo }: { mes: number; titulo: string }) {
  const e = useEstado();
  const meta = e.datos?.meta;
  const serie = (e.datos?.meses ?? [])
    .filter((m) => m.mes === mes && m.count !== null)
    .sort((a, b) => a.anio - b.anio);
  const ref = serie.find((m) => m.anio === e.anio) ?? serie.at(-1);
  if (!serie.length || !ref) return null;
  const tope = Math.max(1, ...serie.map((m) => m.count ?? 0));
  const columnas = { gridTemplateColumns: `repeat(${serie.length}, minmax(0, 1fr))` };
  return (
    <figure className="grafico">
      <figcaption className="grafico-titulo">
        {titulo}
        <span className="grafico-leyenda">
          <i className="muestra-franja" aria-hidden /> {t.franjaUsual}
        </span>
      </figcaption>
      <p className="grafico-subtitulo">
        {t.historicoMismoMes(serie[0]?.anio ?? 0, serie.at(-1)?.anio ?? 0)}
      </p>
      <div
        className="grafico-barras mismo-mes"
        role="img"
        aria-label={`${titulo}. ${e.anio}: ${formatoNumero(ref.count ?? 0)} ${t.focosEq}, ${nombreCategoria(ref.cat)}.`}
        style={columnas}
      >
        <div
          className="franja-usual"
          aria-hidden
          style={{
            bottom: `${(ref.p25 / tope) * 100}%`,
            height: `${((ref.p75 - ref.p25) / tope) * 100}%`,
          }}
        />
        {serie.map((m) => {
          const actual = m.anio === e.anio;
          return (
            <div
              key={m.anio}
              className="grafico-columna"
              title={`${m.anio}: ${formatoNumero(m.count ?? 0)} ${t.focosEq} · ${nombreCategoria(m.cat)}`}
            >
              {actual && (
                <span
                  className="valor-actual"
                  style={{ bottom: `${((m.count ?? 0) / tope) * 100}%` }}
                >
                  {formatoCompacto(m.count ?? 0)}
                </span>
              )}
              <div
                className="grafico-pila"
                data-estimado={m.tramo === "estimado"}
                data-actual={actual}
                style={{
                  height: `${((m.count ?? 0) / tope) * 100}%`,
                  backgroundColor: actual ? colorCategoria(meta, m.cat) : undefined,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="grafico-ejes mismo-mes-ejes" aria-hidden style={columnas}>
        {serie.map((m, i) => (
          <span key={m.anio} data-actual={m.anio === e.anio}>
            {m.anio === e.anio || i % 4 === 0 || i === serie.length - 1
              ? `’${String(m.anio).slice(2)}`
              : ""}
          </span>
        ))}
      </div>
      <div className="grafico-eje-titulo">{t.anio} →</div>
    </figure>
  );
}

/** Avisos de la guía (sección 10) para un mes, en una línea cada uno. */
function Avisos({ periodo }: { periodo: Mes | null }) {
  const avisos: string[] = [];
  if (periodo?.count === null || periodo?.cat === "sin_dato") avisos.push(t.avisoSinDato);
  if (periodo?.tramo === "estimado") avisos.push(t.avisoEstimado, t.avisoFrp);
  if (periodo?.incierta && periodo.cat_inf && periodo.cat_sup)
    avisos.push(
      t.avisoIncierta(nombreCategoria(periodo.cat_inf), nombreCategoria(periodo.cat_sup)),
    );
  return <ListaAvisos avisos={avisos} />;
}

function ListaAvisos({ avisos }: { avisos: string[] }) {
  if (!avisos.length) return null;
  return (
    <ul className="avisos">
      {avisos.map((a) => (
        <li key={a}>
          <AlertTriangle size={14} aria-hidden />
          {a}
        </li>
      ))}
    </ul>
  );
}

export function PanelResumen() {
  const e = useEstado();
  const meta = e.datos?.meta;
  const titulo = `${t.peru} · ${e.etiquetaPeriodo}`;
  const periodo: Mes | null = e.gran === "mes" ? e.mesSel : null;
  const r = e.rankingAnio;

  const total = e.gran === "anio" ? (r?.count ?? null) : (periodo?.count ?? null);
  const rango =
    periodo &&
    periodo.tramo === "estimado" &&
    periodo.count_inf !== null &&
    periodo.count_sup !== null
      ? t.entre(formatoNumero(periodo.count_inf), formatoNumero(periodo.count_sup))
      : null;

  let cuerpo: ReactNode;
  if (e.error)
    cuerpo = (
      <p className="resumen-mensaje">
        {t.errorDatos} ({e.error})
      </p>
    );
  else if (e.cargando) cuerpo = <p className="resumen-mensaje">{t.cargando}</p>;
  else if (e.gran === "anio") {
    const meses = resumenMeses(e.mesesAnio);
    cuerpo = (
      <>
        <div className="indicadores">
          <Indicador
            titulo={t.satelite}
            valor={r ? (r.tramo === "estimado" ? nombreFuente("estimado") : "VIIRS 375 m") : "—"}
            detalle={r ? t.tramo[r.tramo] : undefined}
          />
          <Indicador
            titulo={t.frenteAnioUsual}
            valor={<Diferencia pct={r?.anomalia_pct ?? null} />}
            detalle={meta ? t.leyendaNota(meta.linea_base[0], meta.linea_base[1]) : undefined}
          />
          <Indicador
            titulo={t.mesPico}
            valor={<span className="capitalize">{r ? t.meses[r.mes_pico - 1] : "—"}</span>}
            detalle={r ? `${formatoNumero(r.count_mes_pico)} ${t.focosEq}` : undefined}
          />
          <Indicador
            titulo={t.agoSep}
            valor={r ? formatoPct(r.pct_ago_sep) : "—"}
            detalle={t.delAnio}
          />
          <Indicador
            titulo={t.mesesSobre}
            valor={meses.sobre}
            detalle={t.mesesSobreDet(meses.bajo)}
          />
          <Indicador
            titulo={t.frp}
            valor={r ? `${formatoCompacto(r.frp)} MW` : "—"}
            detalle={t.frpDet}
          />
        </div>
        <Grafico
          titulo={t.graficoMesesDe(e.anio)}
          eje={t.mesEtiqueta}
          nota={meta ? t.notaGraficoAnio(meta.linea_base[0], meta.linea_base[1]) : undefined}
          barras={e.mesesAnio.flatMap((m) => (m ? [barraMes(m, false)] : []))}
          ejes={e.mesesAnio.flatMap((m, i) =>
            m
              ? [
                  (t.mesesCortos[i] ?? "").charAt(0).toUpperCase() +
                    (t.mesesCortos[i] ?? "").slice(1, 3),
                ]
              : [],
          )}
        />
        {r?.tramo === "estimado" && <ListaAvisos avisos={[t.avisoEstimado]} />}
      </>
    );
  } else {
    const p = periodo;
    const nombreMes = t.meses[e.mes - 1] ?? "";
    const NombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);
    cuerpo = (
      <>
        <div className="indicadores">
          <Indicador
            titulo={t.frenteMismoMes(nombreMes)}
            valor={
              <span className="situacion">
                <i style={{ background: colorCategoria(meta, p?.cat) }} aria-hidden />
                {nombreCategoria(p?.cat)}
                {p?.incierta && <span title={t.incierto}> ≈</span>}
              </span>
            }
            detalle={<Diferencia pct={p?.anomalia_pct ?? null} />}
          />
          <Indicador
            titulo={t.mesUsual(NombreMes)}
            valor={p ? `${formatoNumero(p.p25)}–${formatoNumero(p.p75)}` : "—"}
            detalle={p ? t.loNormalDet(formatoNumero(p.mediana)) : undefined}
          />
          <Indicador
            titulo={t.satelite}
            valor={p ? nombreFuente(p.fuente) : "—"}
            detalle={p ? nombreCalidad(p.calidad) : undefined}
          />
        </div>
        {p && <MismoMesCadaAnio mes={e.mes} titulo={t.mesEnCadaAnio(NombreMes)} />}
        <Avisos periodo={p} />
      </>
    );
  }

  return (
    <PanelFlotante
      id="panel-resumen"
      className="panel-resumen"
      titulo={t.resumen}
      tituloOculto
      resumenCerrado={`${t.resumen} · ${total === null ? "—" : formatoNumero(total)} ${t.focosEq}`}
      abierto={e.paneles.resumen}
      alternar={() => e.alternarPanel("resumen")}
      icono={<BarChart3 size={16} aria-hidden />}
    >
      <div aria-live="polite" aria-atomic="true" className="resumen-cabecera">
        <div className="resumen-area">
          {titulo}
          {(r || periodo) && (
            <span className="etiqueta-tramo">{t.tramo[(periodo ?? r)?.tramo ?? "viirs_real"]}</span>
          )}
        </div>
        {!e.error && !e.cargando && (
          <div className="resumen-total">
            <span className="resumen-numero">{total === null ? "—" : formatoNumero(total)}</span>{" "}
            {t.focosEq} {rango && <span className="resumen-detecciones">({rango})</span>}
          </div>
        )}
      </div>
      {cuerpo}
      <p className="resumen-nota">{t.nota}</p>
    </PanelFlotante>
  );
}
