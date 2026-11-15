<p align="center">
  <img src="assets/logo.png" alt="NinaWillay Logo" width="280">
</p>

# 🛰️ NinaWillay: Satellite Harmonization Pipeline for MODIS & VIIRS (NASA FIRMS)

A reproducible, fully configurable data pipeline for the temporal and spatial harmonization of **NASA FIRMS** active fire records (MODIS and VIIRS) in Peru (2002–2026), easily replicable for any country worldwide.

Developed for the **NASA Space Apps Challenge**.

---

## 📌 Problem Statement

In 2012, NASA FIRMS transitioned its baseline active fire monitoring instrument from **MODIS (1 km resolution)** 🛰️ to **VIIRS (375 m resolution)** 🛰️. Due to its significantly higher spatial resolution and sensor sensitivity, VIIRS detects between 3 to 4 times more active fire hotspots than MODIS for the exact same fire events.

Directly concatenating both series creates an artificial upward trend that skews historical climate analysis and fire risk assessment. This pipeline:
1. 🛰️ Fits a **Quasi-Poisson Generalized Linear Model (GLM)** with a log link to calibrate MODIS Aqua observations to their VIIRS-equivalent baseline during the pre-VIIRS era (2002–2011).
2. 📈 Assembles a **25-year continuous harmonized fire series** (2002–2026) equipped with 95% confidence intervals.
3. 🗓️ Computes **historical climatologies**, percentiles ($p_{10}, p_{25}, \text{median}, p_{75}, p_{90}$), and standardized anomalies to classify fire season severity.
4. 🌐 Exports lightweight, production-ready JSON files designed for immediate rendering in modern interactive web frontends.

---

## 📁 Repository Structure

```text
├── assets/
│   └── logo.png           # NinaWillay project logo
├── config/
│   └── settings.yaml      # Pipeline parameters: country, bounding boxes, time windows, and alert thresholds
├── dataset/               # Raw NASA FIRMS CSV files (modis 🛰️, snpp 🛰️, noaa20 🛰️)
├── explainer/
│   └── index.html         # Interactive visual explainer with satellite timeline & validation evidence
├── output/
│   ├── processed/         # Consolidated calibration, validation, and time-series tables (CSV/JSON)
│   ├── reports/           # Scientific evidence figures (PNG charts)
│   └── web/               # 106 structured JSON files optimized for frontend consumption
├── src/                   # Modular Python pipeline source code
│   ├── aggregate.py       # Spatial and temporal aggregations
│   ├── audit.py           # Duplicate detection and cross-sensor audit
│   ├── calibration.py     # Statistical GLM models (Aqua 🛰️ vs. S-NPP 🛰️)
│   ├── cleaning.py        # Confidence and spatial quality filters
│   ├── cli.py             # Main CLI entrypoint
│   ├── climatology.py     # Baselines, percentiles, and anomalies
│   ├── config.py          # Configuration loader
│   ├── export_web.py      # Web JSON exporter for dashboard visualizers
│   ├── harmonize.py       # Historical reconstruction and uncertainty bands
│   ├── io_firms.py        # NASA FIRMS CSV readers
│   └── validation.py      # Blind hold-out validation
├── requirements.txt       # Python package dependencies
└── README.md
```

---

## 🚀 How to Run the Pipeline

### 1. Requirements & Installation
Python 3.10+ is recommended:
```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. End-to-End Pipeline Execution
Run the complete workflow from raw data ingestion to frontend JSON export with a single command:
```bash
python src/cli.py all
```

### 3. Step-by-Step Execution
You can also run and audit individual stages independently:

| Stage | Command | Purpose |
| :--- | :--- | :--- |
| **1. Ingestion & Quality** | `python src/cli.py build --all-years` | Ingests CSVs, applies confidence thresholds (>30% MODIS 🛰️, nominal/high VIIRS 🛰️), and clips to spatial bounding box |
| **2. Sensor Audit** | `python src/cli.py audit` | Diagnoses orbital drift and cross-sensor ratios (Terra 🛰️ vs Aqua 🛰️ vs S-NPP 🛰️ vs NOAA-20 🛰️) |
| **3. Calibration** | `python src/cli.py calibrate` | Fits GLM models using 2012–2017 training window |
| **4. Validation** | `python src/cli.py validate` | Evaluates blind hold-out performance against observed VIIRS 🛰️ data (2018–2022) |
| **5. Harmonization** | `python src/cli.py harmonize` | Scales 2002–2011 Aqua 🛰️ series to VIIRS 🛰️ scale and merges with 2012–2026 observed records |
| **6. Climatology** | `python src/cli.py climatology` | Computes historical baselines and anomaly percentiles across the national level and 25 regions |
| **7. Web Export** | `python src/cli.py export` | Generates 106 structured web JSON files in `output/web/` |

---

## 📊 Frontend Data Schema (`output/web/`)

All deliverables for web visualizers and dashboards are centralized in `output/web/`:

| File(s) | Description | Frontend Use Case |
| :--- | :--- | :--- |
| `meta.json` | Pipeline metadata, temporal span (2002–2026), GLM factor ($2.85\times$), list of 25 regions, and alert thresholds | Global configuration and dashboard filters |
| `cells_index.json` | Index of temporal layers and grid resolutions (0.25° pre-2012; 0.1° from 2012+) | Layer switcher for spatial maps |
| `cells_{year}.json` | Cell centroid coordinates (`lat`, `lon`), harmonized fire counts, and FRP | Heatmaps and spatial fire density layers |
| `climatology_{region}.json` | Seasonal cycle ($p_{10}, p_{25}, \text{median}, p_{75}, p_{90}$) and monthly historical anomalies (2002–2026) | Seasonal tracking and trend charts |
| `ranking_{region}.json` | Annual totals, accumulated FRP, percent anomaly, and severity level (`normal`, `moderate`, `high`, `extreme`) | Historical comparison and KPI cards |
| `calendar_{region}.json` | Week $\times$ Year matrix (weeks 1 to 53) | GitHub-style thermal calendar heatmap |

---

## 🌍 Replicating for Any Other Country

The pipeline architecture is completely generic and decoupled from Peru. To deploy it for **Brazil, Colombia, Bolivia, or any other region**:

1. **Download NASA FIRMS Data**:
   - Download the country's active fire CSVs from NASA FIRMS and place them into `dataset/modis/`, `dataset/snpp/`, and `dataset/noaa20/`.
2. **Configure `config/settings.yaml`**:
   - Update `country` and `country_name` (e.g., `colombia` and `"Colombia"`).
   - Set the national bounding box `bbox: [min_lon, min_lat, max_lon, max_lat]`.
   - Define regional administrative units (provinces, states, or departments) under `aois` with their respective bounding boxes.
3. **Execute the Pipeline**:
   ```bash
   python src/cli.py all
   ```
   The engine will automatically recalibrate cross-sensor factors, calculate regional climatologies, and generate fresh JSON files in `output/web/`.

---

## 🔬 Scientific Evidence & Model Validation

Key validation benchmarks obtained from NASA FIRMS data:
- 🛰️ **Global Scaling Factor:** $2.85\times$ (Aqua count multiplier to match VIIRS scale).
- 🎯 **Mean Annual Relative Absolute Error (Hold-out 2018–2022):** $9.6\%$ (blind validation).
- 📊 **Weekly Correlation:** Pearson $r = 0.96$ between predicted and observed fire counts.
- ⏱️ **Continuous Coverage:** 1,271 consecutive weeks processed from 2002 through November 2026.

To inspect interactive charts and technical details:
- Open [`explainer/index.html`](explainer/index.html) in your browser.
- Check the generated validation figures in [`output/reports/`](output/reports/):
  - `harmonized_series.png`: 25-year continuous reconstructed series.
  - `prediction_vs_snpp.png`: Blind hold-out validation (predicted MODIS vs. observed VIIRS S-NPP).
  - `calibration_validation.png`: GLM Quasi-Poisson regression fit.
  - `audit_annual_counts.png`: Uncalibrated raw sensor counts highlighting the sensor gap.
