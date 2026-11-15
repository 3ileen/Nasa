import { formatoNumero, t } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { mesesDelAnio } from "@/lib/historico";
import { categoriaMostrada, colorCategoria, nombreCategoria } from "./anomalia";

/**
 * Todos los años × meses. Tocar una casilla elige ese mes; tocar el año elige el año completo.
 * Las categorías resaltadas en la leyenda solo atenúan el resto aquí (no filtran el mapa).
 */
export function MatrizHistorica() {
  const e = useEstado();
  const datos = e.datos;
  if (!datos) return null;
  const capitalizar = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  return (
    <div className="matriz" role="group" aria-label={t.todosLosAnios}>
      <div className="matriz-ejes" aria-hidden>
        <span>{t.anio} ↓</span>
        <span>{t.mesEtiqueta} →</span>
      </div>
      <div className="matriz-fila matriz-cabecera" aria-hidden>
        <span />
        {t.mesesCortos.map((m, i) => (
          <span key={i}>{m.charAt(0).toUpperCase() + m.slice(1, 3)}</span>
        ))}
      </div>
      {[...e.anios].reverse().map((a) => {
        const actual = a === e.anio;
        // Mientras se resalta sin un mes elegido no hay un año activo: no se marca la fila.
        const eligiendo = e.activas.length > 0 && e.gran === "anio";
        return (
          <div
            key={a}
            className="matriz-fila"

            data-actual={actual && !eligiendo}
            data-anio-completo={actual && e.gran === "anio" && !eligiendo}
          >
            <button
              type="button"
              className="matriz-anio"
              aria-pressed={actual && e.gran === "anio" && !eligiendo}
              aria-label={`${a} · ${t.todoElAnio}`}
              onClick={() => {
                e.elegirAnio(a);
                e.verAnioCompleto();
              }}
            >
              {a}
            </button>
            {mesesDelAnio(datos.meses, a).map((m, i) => {
              if (!m) return <span key={i} className="matriz-celda matriz-vacia" aria-hidden />;
              const cat = categoriaMostrada(m);
              const texto = t.tooltipMatriz(
                capitalizar(t.meses[i] ?? ""),
                a,
                m.count === null ? t.sinDato : formatoNumero(m.count),
                nombreCategoria(cat) + (m.preliminar ? ` · ${t.preliminarCorto}` : ""),
              );
              const elegido = actual && e.gran === "mes" && e.mes === i + 1;
              return (
                <button
                  type="button"
                  key={i}
                  className="matriz-celda"
                  style={{ backgroundColor: colorCategoria(datos.meta, cat) }}
                  data-estimado={m.tramo === "estimado"}
                  data-preliminar={m.preliminar}
                  data-atenuado={!elegido && !e.categoriaVisible(cat)}
                  data-elegido={elegido}
                  aria-pressed={elegido}
                  aria-label={texto}
                  title={texto}
                  onClick={() => e.elegirPeriodo(a, i + 1)}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
