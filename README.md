# 🚦 Gridlock
### Event-Driven Traffic Incident Intelligence for Bengaluru

<p align="center">
  <img src="https://img.shields.io/badge/City-Bengaluru-orange?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/ML-LightGBM%20%7C%20XGBoost-blue?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20TypeScript-informational?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Hackathon-Gridlock%202.0%20Round%202-purple?style=for-the-badge&logo=flipkart&logoColor=white"/>
  <img src="https://img.shields.io/badge/Live%20Demo-gridlock--tz9k.onrender.com-success?style=for-the-badge&logo=render&logoColor=white"/>
</p>

---

> **Gridlock** is a predictive traffic incident intelligence platform built for Bengaluru. It ingests real-world incident data, trains machine learning models to predict severity, duration, and road closure risk — and surfaces everything through a live geospatial dashboard with actionable resource recommendations.

🌐 **Live Demo → [gridlock-tz9k.onrender.com](https://gridlock-tz9k.onrender.com)**

Built as a submission for **Gridlock Hackathon 2.0 - Round 2** — Hosted by Flipkart.

---

## 🌆 The Problem

Bengaluru loses millions of hours annually to traffic incidents. Existing systems are **reactive** — traffic control responds *after* a jam forms. Gridlock shifts the paradigm to **predictive**: given an incoming incident signal, the system forecasts its impact and recommends pre-emptive resource deployment before congestion cascades.

---

## ✨ What It Does

| Capability | Details |
|---|---|
| 🔮 **Severity Prediction** | Classifies every incoming incident as HIGH / MEDIUM / LOW impact using LightGBM |
| ⏱️ **Duration Forecasting** | Predicts how long an incident will last (XGBoost regressor) |
| 🚧 **Road Closure Risk** | Binary LightGBM classifier flags closure-prone incidents before they happen |
| 🗺️ **Live Hotspot Map** | Geospatial heatmap on MapMyIndia Mappls SDK showing incident clusters across Bengaluru |
| 🧠 **Resource Recommendations** | Rule-based engine suggests manpower, barricades, and diversion routes per incident |
| 📊 **Analytics Dashboard** | Hourly / daily trends, geohash-based spatial hotspots, incident type breakdowns |
| 📈 **Model Metrics Panel** | Tracks model accuracy, feature importances, and pipeline version |

---

## 🗃️ Dataset

- **Source:** Astram — real Bengaluru traffic incident dataset
- **Size:** 8,173 incidents
- **Period:** November 2023 – April 2024
- **Coverage:** Accidents, breakdowns, protests, waterlogging, VIP movements, signal failures, and more

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│              ML Training Pipeline               │
│   train_pipeline_v14.py  ·  Astram Dataset      │
│   LightGBM (Severity/Closure) + XGBoost (Duration) │
└─────────────────┬───────────────────────────────┘
                  │  Pre-baked inference lookup JSON
                  ▼
┌─────────────────────────────────────────────────┐
│              Express API Server                 │
│   /predict  →  Inference Engine + Rules         │
│   /analytics →  Temporal & Spatial Aggregates   │
└─────────────────┬───────────────────────────────┘
                  │  React Query + Generated Hooks
                  ▼
┌─────────────────────────────────────────────────┐
│           React Dashboard (Vite)                │
│   Overview Map · Predict · Analytics · Pipeline │
└─────────────────────────────────────────────────┘
```

The API serves predictions from a **pre-baked `inference_lookup.json`** — a multidimensional mapping of all input combinations to model scores — enabling zero-latency inference without a live Python runtime in production.

---

## 📁 Project Structure

```
gridlock/
├── ml/
│   ├── train_pipeline_v14.py     # Full ML training pipeline
│   └── data/                     # Astram dataset
│
├── artifacts/
│   ├── api-server/               # Express 5 backend
│   │   ├── src/routes/ml.ts      # Prediction + resource recommendation engine
│   │   └── data/
│   │       ├── inference_lookup.json   # Pre-baked model outputs
│   │       └── events.json             # Historical event data
│   │
│   └── gridlock-dashboard/       # React frontend
│       └── src/pages/
│           ├── Overview.tsx      # MapMyIndia hotspot map
│           ├── Predict.tsx       # Real-time inference UI
│           ├── Analytics.tsx     # Charts and trend analysis
│           └── Pipeline.tsx      # Model performance metrics
│
├── lib/
│   ├── api-spec/openapi.yaml     # OpenAPI 3.0 contract (source of truth)
│   ├── api-client-react/         # Orval-generated React Query hooks
│   └── api-zod/                  # Orval-generated Zod schemas
│
└── scripts/                      # Utility and post-merge scripts
```

---

## 🛠️ Tech Stack

**Frontend**
- React 19 · Vite · TypeScript · Tailwind CSS v4
- shadcn/ui · wouter (routing) · Recharts (charts)
- MapMyIndia Mappls SDK v3.0 (geospatial maps)

**Backend**
- Express 5 · TypeScript · Zod · Pino

**Machine Learning**
- LightGBM · XGBoost · scikit-learn · Pandas · NumPy
- Python 3.11+

**Tooling**
- pnpm workspaces (monorepo) · Orval (API codegen from OpenAPI) · Docker · Render

---

## 🧠 ML Models

| Model | Algorithm | Task | Target |
|-------|-----------|------|--------|
| **M1 — Severity** | LightGBM Classifier | Multiclass | HIGH / MEDIUM / LOW |
| **M2 — Duration** | XGBoost Regressor | Regression | Minutes |
| **M3 — Closure Risk** | LightGBM Classifier | Binary | Closure Yes/No |

Feature inputs include incident type, time of day, day of week, zone, weather signals, and historical frequency at the location.

---

## 🗺️ Coverage Zones

Bengaluru's highest-density incident corridors tracked by Gridlock:

- Outer Ring Road — Silk Board · Marathahalli · Hebbal
- Whitefield & ITPL corridor
- Electronic City & Hosur Road
- Central Business District — MG Road · Brigade Road
- Airport Expressway (NH44)
- Sarjapur Road · Bannerghatta Road

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Start the API server
pnpm --filter @workspace/api-server run dev

# 3. Start the dashboard
pnpm --filter @workspace/gridlock-dashboard run dev
```

Dashboard → `http://localhost:5173` &nbsp;·&nbsp; API → `http://localhost:5000`

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

<p align="center">
  Built with ❤️ for Bengaluru &nbsp;·&nbsp; Flipkart Grid 6.0 Hackathon 🏆
</p>
