# Interactive Data Visualization — Agricultural & Rural Development
 
An interactive web application for exploring World Bank agricultural and rural development indicators across 49 countries, built with **Flask**, **D3.js v7**, and **scikit-learn**.
 
Developed as part of the Information Visualization course (VU 2026) at TU Wien.
 
![Python](https://img.shields.io/badge/Python-3.11-blue)
![D3.js](https://img.shields.io/badge/D3.js-v7-orange)
![Flask](https://img.shields.io/badge/Flask-3.x-lightgrey)
 
---

<img width="1280" height="604" alt="EX2Video-ezgif com-video-to-gif-converter" src="https://github.com/user-attachments/assets/92543cb0-f2aa-4db9-bb71-7bbde5b746cf" />

--- 
## Overview
 
The application provides three fully coordinated views for interactive data exploration:
 
- **Choropleth Map** — World map colored by the selected indicator, with country-level tooltips showing 8 key variables on hover.
- **PCA Scatterplot** — 2D projection of all indicators via Principal Component Analysis, with rectangular brushing for multi-country selection.
- **Time Series Chart** — Line chart showing indicator trends from 1960 to 2020 for selected countries.
All views are linked through shared interaction state: hovering, clicking, brushing, and changing the year or indicator updates every view simultaneously using D3's enter/update pattern (no full redraws).
 
## Features
 
- **Coordinated highlighting** — hover over a dot in the scatterplot to highlight the corresponding country on the map, and vice versa.
- **Rectangular brushing** — drag a selection rectangle on the scatterplot to select multiple countries, highlighting them on the map and displaying all their time series.
- **Year slider** — dynamically updates the choropleth coloring, PCA projection, and time series year marker.
- **Indicator dropdown** — switch between 52 agricultural/rural development indicators to update all views.
- **Detail-on-demand tooltip** — hover over a country on the map to see 8 key variable values for the selected year.
## Tech Stack
 
**Backend:** Python, Flask, pandas, scikit-learn (PCA, StandardScaler)
 
**Frontend:** D3.js v7, TopoJSON, HTML/CSS
 
**Data pipeline:** pandas for loading and filtering, Jinja2 templates for server-to-client data transfer, REST API endpoints for dynamic updates
 
## Project Structure
 
```
├── main.py                  # Flask server with API endpoints
├── data.py                  # Data loading, filtering, and PCA computation
├── agriRuralDevelopment_cleaned.csv  # Cleaned dataset (from Exercise 1)
├── templates/
│   └── index.html           # Main page with embedded styles and layout
└── static/
    ├── css/
    │   └── style.css        # Additional styles
    └── js/
        ├── map.js           # Choropleth map + tooltip (D3 + TopoJSON)
        ├── scatterplot.js   # PCA scatterplot + brushing
        ├── timeseries.js    # Time series line chart
        └── main.js          # Shared interaction state (slider, dropdown)
```
 
## API Endpoints
 
| Endpoint | Description |
|---|---|
| `GET /` | Main page with initial PCA data |
| `GET /api/pca?year=` | PCA coordinates for a given year |
| `GET /api/choropleth?indicator=&year=` | Per-country values for the choropleth |
| `GET /api/timeseries?countries=&indicator=` | Time series data for selected countries |
| `GET /api/tooltip?country=&year=` | 8 indicator values for the tooltip |
 
## Setup
 
```bash
# Install dependencies
pip install flask pandas scikit-learn
 
# Run the server
python main.py
```
 
Then open `http://127.0.0.1:5000` in your browser.
 
## Dataset
 
World Bank — Agricultural & Rural Development indicators, covering 49 countries from 1960 to 2020 with 52 indicators including access to electricity, agricultural land use, cereal production, GDP per capita, forest area, population metrics, and more.
 
The raw data was cleaned and imputed in Exercise 1 using temporal interpolation and iterative imputation (Random Forest).
 
Group 17 — Information Visualization VU, TU Wien, 2026
