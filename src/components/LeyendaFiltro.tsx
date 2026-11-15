import { Check } from "lucide-react";
import { t, formatoNumero } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { hayFiltroNiveles } from "@/lib/filtros";
import { rangosLeyenda } from "@/lib/niveles";

/** Leyenda de 4 niveles que también funciona como filtro (aria-pressed). */
export function LeyendaFiltro() {
  const { limites, activos, alternarNivel } = useEstado();
  const rangos = rangosLeyenda(limites);
  const sinFiltro = !hayFiltroNiveles(activos);
  return (
    <div
      className="leyenda"
      role="group"
      aria-labelledby="leyenda-titulo"
      aria-describedby="leyenda-nota"
    >
      <h3 id="leyenda-titulo" className="leyenda-titulo">
        {t.leyenda}
      </h3>
      <div className="leyenda-botones">
        {rangos.map((r) => {
          const activo = activos[r.nivel];
          const texto =
            r.hasta === null
              ? t.masDe(formatoNumero(r.desde - 1))
              : r.desde > r.hasta
                ? t.rangoVacio
                : r.nivel === 1
                  ? t.hasta(formatoNumero(r.hasta))
                  : r.desde === r.hasta
                    ? t.porDia(formatoNumero(r.desde))
                    : t.rango(formatoNumero(r.desde), formatoNumero(r.hasta));
          return (
            <button
              type="button"
              key={r.nivel}
              className="leyenda-boton"
              aria-pressed={activo}
              data-activo={activo}
              onClick={() => alternarNivel(r.nivel)}
            >
              <span className={`legend-swatch level-${r.nivel}`} aria-hidden>
                {activo && <Check size={12} strokeWidth={3} />}
              </span>
              <span className="leyenda-texto">
                <strong>{t.niveles[r.nivel]}</strong>
                <span>{texto}</span>
              </span>
            </button>
          );
        })}
      </div>
      <div className="leyenda-fijos" aria-hidden>
        <span>
          <span className="legend-swatch level-0" />
          {t.diaSinFocos}
        </span>
        <span>
          <span className="legend-swatch nivel-sin-datos" />
          {t.sinDatosTodavia}
        </span>
      </div>
      <p id="leyenda-nota" className="leyenda-nota">
        {sinFiltro && <strong className="leyenda-sin-filtro">{t.sinFiltroNiveles} </strong>}
        {t.leyendaNota}
      </p>
    </div>
  );
}
