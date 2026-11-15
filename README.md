# NinaWillay

**Satellite Fire Intelligence** — a historical calendar of fire hotspots in Peru (2002–2026), with
MODIS and VIIRS harmonized into a single series, for the whole country and each of its 25 departments.
NASA Space Apps Challenge 2026 · Junior FC, Moquegua.

## What it does

- **Calendar (years × months):** each month is colored by how much fire it had compared with the
  usual for that same month (2003–2024 baseline), from "much less fire" to "record".
- **Top years:** years ranked by number of hotspots.
- **Summary:** totals, peak month, share of the August–September season and fire radiative power.
- **Map:** hotspot density (per 100 km²) by year or month, with ~28 km cells until 2011 and ~11 km
  cells from 2012.
- **Region filter:** Peru or any of its 25 departments.
- Spanish, English and Quechua; light and dark mode; works on phones.

## Repository structure

```text
├── src/             # Frontend (React + TypeScript): the only part deployed to Vercel
├── public/data/     # Static JSON used by the web app (exported by the pipeline)
└── data-pipeline/   # Python data pipeline (not deployed; see .vercelignore)
```

## Data pipeline (`data-pipeline/`)

The Python pipeline reads **NASA FIRMS** active-fire records (MODIS Aqua, VIIRS S-NPP / NOAA-20),
calibrates MODIS to VIIRS-equivalent counts with a quasi-Poisson GLM, builds the 2003–2024 baseline
and anomalies, and exports the JSON files the web app reads. See
[data-pipeline/README.md](data-pipeline/README.md).

To refresh the web app with a new run, copy `data-pipeline/output/web/` into
`public/data/historico/` (department files go into `regiones/`).

## Tech stack

React 19 · TypeScript · TanStack Start · Vite · Leaflet + MapLibre · Turf.js · Vitest.
All data are static JSON files in `public/data/historico/`; there is no database.

## Development

```bash
npm install
npm run dev      # http://localhost:8080
npm test         # unit tests
npm run lint
```

## Deploying to Vercel

1. In Vercel: **Add New → Project** and import this repository.
2. Keep the default settings: `vercel.json` and `vite.config.ts` already configure the build.
   `.vercelignore` leaves `data-pipeline/` out, so only the frontend is deployed.
3. **Deploy**. Every push to the production branch redeploys automatically.

## Use of artificial intelligence

This project was built with AI assistance: **Claude** (Anthropic), through **Claude Code**, generated
most of the frontend code, texts and translations; **Lovable** generated the initial scaffold.
Satellite data come from NASA FIRMS. Details on where and how AI was used: [AI_DISCLOSURE.md](AI_DISCLOSURE.md).
