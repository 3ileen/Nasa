## Application architecture

- Keep the single-screen application at the index route with browser-safe data/calculation modules and translated interface strings (es, en, qu); this preserves an accessible, unified workflow.
- Load Leaflet and MapLibre only in the lazy map component behind ClientOnly; these libraries require browser APIs and must not enter SSR evaluation.
- Use React 19-compatible React Leaflet and the existing TanStack routing bootstrap; older React Leaflet releases target incompatible React versions.
- Use keyless OpenFreeMap tiles through MapLibre's Leaflet bridge with an explicit Vite worker URL.
- Data lives as static JSON in `public/data/historico/` (pipeline schema 1.2); test the statistical rules independently.
- Do not edit generated files such as `src/routeTree.gen.ts`.

## Deployment

- Deployed on Vercel. `vite.config.ts` builds with Nitro's `vercel` preset into `.vercel/output`; `vercel.json` only sets the build command.
