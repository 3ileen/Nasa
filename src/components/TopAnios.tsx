import { formatoNumero, formatoPctSigno, t } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { categoriaAnio } from "@/lib/historico";
import { colorCategoria, nombreCategoria } from "./anomalia";

/**
 * Years sorted by hotspot count (most fire on top). Incomplete years go last without a
 * rank. The bar color compares the year with a usual year, using the matrix scale.
 * Tapping a row selects that whole year.
 */
export function TopAnios() {
  const e = useEstado();
  const datos = e.datos;
  if (!datos) return null;
  const filas = [...datos.ranking].sort(
    (a, b) => (a.puesto ?? Infinity) - (b.puesto ?? Infinity) || b.count - a.count,
  );
  const max = Math.max(...filas.map((r) => r.count));
  return (
    <table className="top-anios">
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">{t.anio}</th>
          <th scope="col" className="top-focos">
            {t.colFocos}
          </th>
        </tr>
      </thead>
      <tbody>
        {filas.map((r) => {
          const cat = categoriaAnio(r);
          const elegido = r.anio === e.anio && e.gran === "anio";
          const situacion = r.completo
            ? `${nombreCategoria(cat)}${r.anomalia_pct === null ? "" : ` (${formatoPctSigno(r.anomalia_pct)})`}`
            : t.anioIncompleto;
          return (
            <tr
              key={r.anio}
              data-elegido={elegido}
              onClick={() => {
                e.elegirAnio(r.anio);
                e.verAnioCompleto();
              }}
            >
              <td className="top-puesto">{r.puesto ?? "—"}</td>
              <td>
                <button
                  type="button"
                  className="top-anio"
                  aria-pressed={elegido}
                  aria-label={t.tooltipTop(r.anio, formatoNumero(r.count), situacion)}
                  title={t.tooltipTop(r.anio, formatoNumero(r.count), situacion)}
                  onClick={(ev) => {
                    ev.stopPropagation();
                    e.elegirAnio(r.anio);
                    e.verAnioCompleto();
                  }}
                >
                  {r.anio}
                </button>
              </td>
              <td className="top-focos">
                <span className="top-barra-fondo" aria-hidden>
                  <span
                    className="top-barra"
                    data-estimado={r.tramo === "estimado"}
                    data-preliminar={r.preliminar}
                    style={{
                      width: `${(100 * r.count) / max}%`,
                      backgroundColor: colorCategoria(datos.meta, cat),
                    }}
                  />
                </span>
                <span className="top-numero">{formatoNumero(r.count)}</span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
