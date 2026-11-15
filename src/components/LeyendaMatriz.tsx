import { Check } from "lucide-react";
import { t } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import type { CategoriaId } from "@/lib/historico";
import { colorCategoria, textoSobre } from "./anomalia";

/** Leyenda de la matriz: tocar un color resalta esos meses en la matriz (no cambia el mapa). */
export function LeyendaMatriz() {
  const e = useEstado();
  const meta = e.datos?.meta;
  if (!meta) return null;
  const categorias = [...meta.categorias]
    .filter((c) => c.id !== "sin_dato")
    .sort((a, b) => a.orden - b.orden); // de menos (claro) a más (oscuro)
  const [a, b] = meta.linea_base;
  return (
    <div
      className="leyenda"
      role="group"
      aria-labelledby="leyenda-titulo"
      aria-describedby="leyenda-nota"
    >
      <h3 id="leyenda-titulo" className="leyenda-titulo">
        {t.comparadoMismoMes(a, b)}
      </h3>
      <div className="leyenda-chips">
        {categorias.map((c) => {
          const id = c.id as CategoriaId;
          const marcado = e.activas.includes(id);
          const color = colorCategoria(meta, id);
          return (
            <button
              type="button"
              key={c.id}
              className="leyenda-chip"
              aria-pressed={marcado}
              data-activo={e.activas.length === 0 || marcado}
              title={t.categorias[c.id]}
              onClick={() => e.alternarCategoria(id)}
            >
              <span
                className="legend-swatch"
                style={{ background: color, color: textoSobre(color) }}
                aria-hidden
              >
                {marcado && <Check size={11} strokeWidth={3} />}
              </span>
              {t.categoriasCortas[c.id]}
            </button>
          );
        })}
      </div>
      <p id="leyenda-nota" className="leyenda-nota">
        {t.ayudaResaltar}
      </p>
    </div>
  );
}
