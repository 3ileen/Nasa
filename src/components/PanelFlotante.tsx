import type { ReactNode } from "react";
import { ChevronDown, Minus } from "lucide-react";
import { t } from "@/i18n";

type Props = {
  id: string;
  titulo: string;
  /** Text of the small button when the panel is hidden, e.g. "Área · Moquegua". */
  resumenCerrado: string;
  abierto: boolean;
  alternar: () => void;
  icono?: ReactNode;
  className?: string;
  /** Hides the visible title (kept for screen readers). */
  tituloOculto?: boolean;
  children: ReactNode;
};

/** Floating panel over the map that can be hidden and shown again. */
export function PanelFlotante({
  id,
  titulo,
  resumenCerrado,
  abierto,
  alternar,
  icono,
  className = "",
  tituloOculto,
  children,
}: Props) {
  const contenido = `${id}-contenido`;
  return (
    <section
      id={id}
      tabIndex={-1}
      className={`panel-flotante ${className}`}
      data-abierto={abierto}
      aria-labelledby={`${id}-titulo`}
    >
      {!abierto && (
        <button
          type="button"
          className="panel-cerrado"
          aria-expanded={false}
          aria-controls={contenido}
          onClick={alternar}
        >
          {icono}
          <span className="panel-cerrado-texto">{resumenCerrado}</span>
          <ChevronDown aria-hidden size={16} />
        </button>
      )}
      <div id={contenido} className="panel" hidden={!abierto}>
        <div className="panel-cabecera">
          <h2 id={`${id}-titulo`} className={tituloOculto ? "sr-only" : "panel-titulo"}>
            {icono}
            {titulo}
          </h2>
          <button
            type="button"
            className="panel-ocultar"
            aria-expanded={abierto}
            aria-controls={contenido}
            aria-label={t.ocultar(titulo)}
            title={t.ocultar(titulo)}
            onClick={alternar}
          >
            <Minus aria-hidden size={16} />
          </button>
        </div>
        <div className="panel-cuerpo">{children}</div>
      </div>
    </section>
  );
}
