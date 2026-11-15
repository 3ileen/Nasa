import type { ReactNode } from "react";
import { ChevronDown, Minus } from "lucide-react";
import { t } from "@/i18n";

type Props = {
  id: string;
  titulo: string;
  /** Texto del botón pequeño cuando el panel está oculto, p. ej. "Área · Moquegua". */
  resumenCerrado: string;
  abierto: boolean;
  alternar: () => void;
  icono?: ReactNode;
  className?: string;
  /** Oculta el título visible (se mantiene para lectores de pantalla). */
  tituloOculto?: boolean;
  children: ReactNode;
};

/** Panel flotante sobre el mapa que se puede ocultar y volver a mostrar. */
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
