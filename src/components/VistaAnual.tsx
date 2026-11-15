import { t, formatoNumero } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { nivelVisible } from "@/lib/filtros";
import { claveFecha, diaSemana, diasDelMes } from "@/lib/periodos";

/** 12 mini calendarios sin números. Tocar un mes lleva el calendario principal a ese mes. */
export function VistaAnual() {
  const { anio, mes, indiceArea, niveles, activos, ultimaFecha, irAMes } = useEstado();
  return (
    <div className="vista-anual">
      {t.meses.map((nombre, m) => {
        const dias = diasDelMes(anio, m);
        let total = 0;
        const celdas = Array.from({ length: dias }, (_, i) => {
          const clave = claveFecha(anio, m, i + 1);
          const sinDatos = !!ultimaFecha && clave > ultimaFecha;
          const nivel = niveles.get(clave) ?? 0;
          const inactivo = nivel > 0 && !nivelVisible(nivel, activos);
          if (nivel > 0 && !inactivo) total += indiceArea.get(clave)?.peso ?? 0;
          return (
            <span
              key={clave}
              className={`mini-dia ${sinDatos ? "nivel-sin-datos" : `level-${nivel}`}`}
              data-inactivo={inactivo}
              style={i === 0 ? { gridColumnStart: diaSemana(clave) + 1 } : undefined}
            />
          );
        });
        return (
          <button
            type="button"
            key={nombre}
            className="mini-mes"
            data-actual={m === mes}
            aria-current={m === mes ? "true" : undefined}
            aria-label={t.irAlMes(nombre, formatoNumero(total))}
            onClick={() => irAMes(m)}
          >
            <span className="mini-mes-nombre">{t.mesesCortos[m]}</span>
            <span className="mini-mes-dias" aria-hidden>
              {celdas}
            </span>
          </button>
        );
      })}
    </div>
  );
}
