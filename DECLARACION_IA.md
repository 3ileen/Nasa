# Declaración de uso de inteligencia artificial

**NinaWillay** se desarrolló con asistencia de herramientas de inteligencia artificial (IA),
conforme a la guía de envío del NASA Space Apps Challenge 2026.
El equipo **Junior FC (Moquegua)** definió el problema, los requisitos, el diseño y cada decisión,
y revisó y probó todo lo generado.

## Herramientas usadas

| Herramienta                                      | Para qué                                                                                                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Claude** (Anthropic), mediante **Claude Code** | Programación asistida del frontend y su documentación (ver detalle abajo).                                                                                           |
| **Lovable**                                      | Generó la estructura inicial del proyecto (plantilla TanStack Start y los componentes base de `src/components/ui/`). Ya no se usa: el proyecto se publica en Vercel. |

## Dónde y cómo se usó la IA

**Código (generado con IA y revisado por el equipo)**

- `src/components/`: mapa, matriz de años × meses, tabla "Top años", resumen, panel de periodo, leyendas y filtros.
- `src/estado/`: manejo del periodo, la región, el idioma, el tema y los paneles.
- `src/lib/`: lectura de los datos, densidad del mapa, categorías y descarga en CSV.
- `src/styles.css`: diseño visual, modo claro y oscuro, versión para celular.
- `src/lib/*.test.ts`, `src/i18n/*.test.ts`: pruebas automáticas.
- `vite.config.ts`, `vercel.json`: configuración de compilación y despliegue.

**Textos y traducciones (generados con IA)**

- `src/i18n/es.ts`, `src/i18n/en.ts`: textos de la interfaz en español e inglés.
- `src/i18n/qu.ts`: traducción al quechua sureño Collao. Es un **borrador generado con IA**,
  ajustado con el léxico abierto [SimiAru](https://github.com/Andre031222/SimiAru) (CC BY-SA 4.0);
  debe revisarlo una persona quechuahablante.

**Datos**

- Los datos satelitales son de **NASA FIRMS** (MODIS Aqua y VIIRS S-NPP / NOAA-20); no fueron generados por IA.
- El procesamiento y la armonización (pipeline del equipo, fuera de este repositorio) se hizo con asistencia de IA.
- `public/data/historico/regiones/regiones.json` y la copia de los archivos por departamento se
  prepararon con scripts generados con IA a partir de esa exportación.

**Documentación**

- `README.md`, `AGENTS.md` y este archivo se redactaron con asistencia de IA.

## Dónde queda registrado (metadatos)

- `package.json`: campos `description` y `keywords` (`ai-assisted`, `ai-generated-code`).
- HTML de la web (`src/routes/__root.tsx`): etiquetas `<meta name="ai-disclosure">` y `<meta name="ai-tools">`.
- `public/data/historico/README.md` y el campo `generado_con` de `regiones/regiones.json`.

---

## Summary (English)

NinaWillay was built with AI assistance. **Claude (Anthropic), used through Claude Code**, generated
most of the frontend source code, interface texts, the English and Quechua translations (the Quechua
version is an AI draft refined with the SimiAru lexicon and pending native-speaker review), tests,
build/deploy configuration and documentation. **Lovable** generated the initial project scaffold.
The data-processing pipeline was also built with AI assistance; the underlying satellite data come
from **NASA FIRMS** (MODIS Aqua, VIIRS) and were not AI-generated. The Junior FC team defined the
problem, requirements and design, and reviewed and tested all AI-generated work.
