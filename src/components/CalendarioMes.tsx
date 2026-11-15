import { ChevronLeft, ChevronRight } from "lucide-react";
import { t, formatoNumero } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { nivelVisible } from "@/lib/filtros";
import { claveFecha, dentro, diaSemana, diasDelMes } from "@/lib/periodos";

/** Un solo calendario mensual: cada día muestra su número y su total, con el color de su nivel. */
export function CalendarioMes() {
  const e = useEstado();
  const { anio, mes, indiceArea, niveles, activos, ultimaFecha, periodo, gran } = e;
  const primero = claveFecha(anio, mes, 1);
  const hueco = diaSemana(primero);
  const dias = diasDelMes(anio, mes);
  const marcar = gran === "semana" || gran === "dia";

  let totalMes = 0;
  for (let d = 1; d <= dias; d++) {
    const clave = claveFecha(anio, mes, d);
    const n = niveles.get(clave) ?? 0;
    if (nivelVisible(n, activos)) totalMes += indiceArea.get(clave)?.peso ?? 0;
  }

  return (
    <div className="calendario">
      <div className="calendario-cabecera">
        <button
          type="button"
          className="boton-icono"
          aria-label={t.mesAnterior}
          title={t.mesAnterior}
          disabled={mes === 0}
          onClick={() => e.moverMes(-1)}
        >
          <ChevronLeft aria-hidden size={18} />
        </button>
        <div className="calendario-mes">
          <h3>{t.mesAnio(mes, anio)}</h3>
          <span>
            {formatoNumero(totalMes)} {t.focosEq}
          </span>
        </div>
        <button
          type="button"
          className="boton-icono"
          aria-label={t.mesSiguiente}
          title={t.mesSiguiente}
          disabled={mes === 11}
          onClick={() => e.moverMes(1)}
        >
          <ChevronRight aria-hidden size={18} />
        </button>
      </div>
      <div className="calendario-dias">
        {t.diasSemana.map((d, i) => (
          <abbr className="weekday" key={i} title={t.diasSemanaLargos[i]}>
            {d}
          </abbr>
        ))}
        {Array.from({ length: hueco }, (_, i) => (
          <span key={`h${i}`} aria-hidden />
        ))}
        {Array.from({ length: dias }, (_, i) => {
          const clave = claveFecha(anio, mes, i + 1);
          const sinDatos = !!ultimaFecha && clave > ultimaFecha;
          const valor = indiceArea.get(clave)?.peso ?? 0;
          const nivel = niveles.get(clave) ?? 0;
          const inactivo = nivel > 0 && !nivelVisible(nivel, activos);
          const elegido = marcar && dentro(clave, periodo);
          const total = formatoNumero(valor);
          const estado = sinDatos ? t.diaSinDatos : nivel === 0 ? t.diaSinFocos : undefined;
          const extra =
            !sinDatos && nivel > 0
              ? `, ${t.niveles[nivel]}${inactivo ? ` (${t.nivelOculto})` : ""}`
              : "";
          return (
            <button
              type="button"
              key={clave}
              className={`calendar-day ${sinDatos ? "nivel-sin-datos" : `level-${nivel}`}`}
              data-inactivo={inactivo}
              data-elegido={elegido}
              data-inicio-semana={gran === "semana" && clave === periodo.inicio}
              data-fin-semana={gran === "semana" && clave === periodo.fin}
              aria-pressed={marcar ? elegido : undefined}
              aria-label={t.ariaDia(i + 1, t.meses[mes] ?? "", total, estado) + extra}
              disabled={sinDatos}
              onClick={() => e.elegirDia(clave)}
            >
              <span className="calendar-day-numero">{i + 1}</span>
              <small>{sinDatos ? "—" : total}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
