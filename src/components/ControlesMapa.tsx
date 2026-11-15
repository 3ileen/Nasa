import { Globe2, Minus, Mountain, Palette, Plus } from "lucide-react";
import { t } from "@/i18n";

type Props = {
  verPeru: () => void;
  acercar: () => void;
  alejar: () => void;
  relieve: boolean;
  alternarRelieve: () => void;
  coloresAltura: boolean;
  alternarColoresAltura: () => void;
};

export function ControlesMapa({
  verPeru,
  acercar,
  alejar,
  relieve,
  alternarRelieve,
  coloresAltura,
  alternarColoresAltura,
}: Props) {
  return (
    <div className="map-controls" role="group" aria-label={t.controlesMapa}>
      <button
        type="button"
        className="boton-mapa"
        title={t.verPeru}
        aria-label={t.verPeru}
        onClick={verPeru}
      >
        <Globe2 aria-hidden size={18} />
      </button>
      <button
        type="button"
        className="boton-mapa"
        title={t.relieve}
        aria-label={t.relieve}
        aria-pressed={relieve}
        data-activo={relieve}
        onClick={alternarRelieve}
      >
        <Mountain aria-hidden size={18} />
      </button>
      <button
        type="button"
        className="boton-mapa"
        title={t.coloresAltura}
        aria-label={t.coloresAltura}
        aria-pressed={coloresAltura}
        data-activo={coloresAltura}
        onClick={alternarColoresAltura}
      >
        <Palette aria-hidden size={18} />
      </button>
      <div className="map-zoom">
        <button
          type="button"
          className="boton-mapa"
          title={t.acercar}
          aria-label={t.acercar}
          onClick={acercar}
        >
          <Plus aria-hidden size={18} />
        </button>
        <button
          type="button"
          className="boton-mapa"
          title={t.alejar}
          aria-label={t.alejar}
          onClick={alejar}
        >
          <Minus aria-hidden size={18} />
        </button>
      </div>
    </div>
  );
}
