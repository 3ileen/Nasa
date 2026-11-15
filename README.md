# NinaWillay

**Satellite Fire Intelligence** — calendario histórico de focos de calor del Perú (2002–2026),
con MODIS y VIIRS armonizados en una sola serie, por país y por departamento.
NASA Space Apps Challenge 2026 · Junior FC, Moquegua.

## Uso de inteligencia artificial

Este proyecto se desarrolló con asistencia de IA: **Claude** (Anthropic), mediante **Claude Code**,
generó la mayor parte del código, los textos y las traducciones; **Lovable** generó la estructura inicial.
Los datos satelitales son de NASA FIRMS. Detalle de dónde y cómo se usó: [DECLARACION_IA.md](DECLARACION_IA.md).

## Tecnologías

React 19 · TypeScript · TanStack Start · Vite · Leaflet + MapLibre · Vitest.
Los datos son archivos JSON estáticos en `public/data/historico/`; no hay base de datos.

## Pipeline de datos (`data-pipeline/`)

El directorio `data-pipeline/` contiene el pipeline en Python que descarga, procesa y armoniza estadísticamente las series de focos de calor de NASA FIRMS (MODIS y VIIRS 2002–2026), exportando los JSON estáticos utilizados por la aplicación web. Se excluye del despliegue en Vercel mediante `.vercelignore`.

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:8080
npm test         # pruebas
npm run lint
```

## Publicar en Vercel

1. En Vercel: **Add New → Project** e importa este repositorio.
2. No cambies nada en la configuración: `vercel.json` y `vite.config.ts` ya la traen.
3. **Deploy**. Cada push a la rama de producción vuelve a publicar.
