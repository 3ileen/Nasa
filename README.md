# NinaWillay

**Satellite Fire Intelligence** — calendario histórico de focos de calor del Perú (2002–2026),
con MODIS y VIIRS armonizados en una sola serie, por país y por departamento.
NASA Space Apps Challenge 2026 · Junior FC, Moquegua.

## Tecnologías

React 19 · TypeScript · TanStack Start · Vite · Leaflet + MapLibre · Vitest.
Los datos son archivos JSON estáticos en `public/data/historico/`; no hay base de datos.

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
