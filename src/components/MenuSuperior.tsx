import { Globe2, Moon, Sun } from "lucide-react";
import { esCodigoIdioma, IDIOMAS, t } from "@/i18n";
import { useEstado } from "@/estado/contexto";
import { LogoNinaWillay } from "./LogoNinaWillay";

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
        <div className="marca" title={`${t.titulo} · ${t.subtitulo}`}>
          <LogoNinaWillay className="marca-logo" />
          <div className="marca-textos">
            <h1>
              <span className="marca-nina">Nina</span>
              <span className="marca-willay">Willay</span>
            </h1>
            {/* Lema de la marca: igual en todos los idiomas, como en el logo. */}
            <p className="marca-lema" lang="en">
              Satellite Fire Intelligence
            </p>
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
