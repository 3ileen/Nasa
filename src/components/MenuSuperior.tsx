import { Flame, Globe2, Moon, Sun } from "lucide-react";
import { esCodigoIdioma, IDIOMAS, t } from "@/i18n";
import { useEstado } from "@/estado/contexto";

const ESCALAS = [100, 115, 130] as const;

export function MenuSuperior() {
  const { escala, fijarEscala, idioma, elegirIdioma, tema, alternarTema } = useEstado();
  const etiquetaTema = tema === "oscuro" ? t.modoClaro : t.modoOscuro;
  return (
    <>
      <a className="skip-link" href="#panel-area">
        {t.saltar}
      </a>
      <header className="menu-superior">
        <div className="marca">
          <div className="brand-icon" aria-hidden>
            <Flame strokeWidth={1.6} />
          </div>
          <div className="marca-textos">
            <h1>{t.titulo}</h1>
            <p>{t.subtitulo}</p>
          </div>
        </div>
        <div className="menu-acciones">
          <span className="menu-equipo">{t.equipo}</span>
          <div className="idioma">
            <Globe2 size={15} aria-hidden />
            <label className="sr-only" htmlFor="idioma">
              {t.idioma}
            </label>
            <select
              id="idioma"
              className="language-select"
              value={idioma}
              onChange={(ev) => {
                if (esCodigoIdioma(ev.target.value)) elegirIdioma(ev.target.value);
              }}
            >
              {IDIOMAS.map((i) => (
                <option key={i.codigo} value={i.codigo} lang={i.lang}>
                  {i.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="boton-tema"
            aria-label={etiquetaTema}
            title={etiquetaTema}
            onClick={alternarTema}
          >
            {tema === "oscuro" ? <Sun aria-hidden size={17} /> : <Moon aria-hidden size={17} />}
          </button>
          <div className="font-controls" role="group" aria-label={t.tamanoTexto(ESCALAS[escala])}>
            <button
              type="button"
              aria-label={t.reducirTexto}
              title={t.reducirTexto}
              disabled={escala === 0}
              onClick={() => fijarEscala((escala - 1) as 0 | 1)}
            >
              A−
            </button>
            <button
              type="button"
              aria-label={t.aumentarTexto}
              title={t.aumentarTexto}
              disabled={escala === 2}
              onClick={() => fijarEscala((escala + 1) as 1 | 2)}
            >
              A+
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
