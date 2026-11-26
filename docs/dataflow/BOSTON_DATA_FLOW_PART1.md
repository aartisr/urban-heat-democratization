# 🗺️ BOSTON DATA END-TO-END FLOW DIAGRAM

## Complete Journey: From Raw Data to Interactive Map

---

## 🎯 OVERVIEW - 5-STAGE PIPELINE

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1: DATA SOURCES        → STAGE 2: PROCESSING           │
│  Raw geographic & heat data      Backend computation            │
│         ↓                               ↓                       │
│  STAGE 3: STORAGE            → STAGE 4: API DELIVERY          │
│  In-memory & file systems        REST endpoints                │
│         ↓                               ↓                       │
│        STAGE 5: VISUALIZATION                                   │
│        Interactive React Map with Layers                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 STAGE 1: DATA SOURCES

### Where does Boston data come from?

```
┌───────────────────────────────────────────────────────────────┐
│                     DATA ACQUISITION LAYER                     │
└───────────────────────────────────────────────────────────────┘

1️⃣ CITY BOUNDARY DATA
   ├─ Source: MassGIS (Massachusetts Geographic Information System)
   ├─ URL: https://download.massgis.digital.mass.gov/arcgis/
   ├─ Format: GeoJSON (Geographic JSON)
   ├─ Files: 
   │  ├─ boston_boundary.geojson (64 KB - simplified)
   │  └─ boston_boundary_precise.geojson (675 KB - detailed)
   ├─ Purpose: Define Boston city boundaries for map rendering
   └─ Update: Once during setup
   
2️⃣ THERMAL (HEAT) DATA
   ├─ Source: Land Surface Temperature (LST) satellite data
   ├─ Format: GeoTIFF raster (satellite imagery grid)
   ├─ Resolution: Cell-based temperature grid
   ├─ Files Generated:
   │  └─ Thermal grid with temperature values
   ├─ Purpose: Show where heat is in the city
   └─ Processing: Normalized to 0-1 scale
   
3️⃣ COOLING ACCESS DATA
   ├─ Source: OpenStreetMap + land use data
   ├─ Format: GeoJSON with cell-level scores
   ├─ Files:
   │  ├─ low_cooling_access_zones.geojson (388 KB)
   │  └─ boston_research_cooling_access_cells.geojson (230 KB)
   ├─ Purpose: Identify areas with poor cooling access
   │  (parks, trees, water are cooling sources)
   └─ Scoring: 0-100 scale (high=poor access)

4️⃣ CHEEGER BOTTLENECK DATA ⭐ (The Important One!)
   ├─ What is Cheeger's Bottleneck?
   │  Graph partitioning algorithm that finds "seams" in networks
   │  Identifies areas where heat is trapped & cooling is fragmented
   ├─ Files:
   │  ├─ cheeger_bottleneck.geojson (150 KB)
   │  └─ boston_research_cheeger_bottleneck.geojson (30 KB)
   ├─ Data Points: Grid cells with priority scores
   ├─ Purpose: Find critical intervention locations
   └─ Score Range: 0-100 (100=most critical)

5️⃣ THERMAL SOURCES (Real-time Optional)
   ├─ Files:
   │  ├─ live_thermal_sources.json (manual or sensor data)
   │  └─ live_thermal_sources.example.json (demo)
   ├─ Purpose: Optional real-time heat sources (buildings, etc)
   └─ Format: GeoJSON with live coordinates

6️⃣ INTERVENTION & COST DATA
   ├─ Files:
   │  ├─ intervention_catalog.json (8 KB - what can be done?)
   │  ├─ intervention_unit_costs.json (6 KB - how much?)
   │  └─ cost_sources.json (2 KB - cost references)
   ├─ Purpose: Know what interventions exist & their costs
   └─ Examples: Tree planting, cool roofs, water features

```

---

## 🔄 STAGE 2: BACKEND PROCESSING

### How is the data prepared for the frontend?

```
┌───────────────────────────────────────────────────────────────┐
│          DATA PROCESSING PIPELINE (Python Backend)            │
└───────────────────────────────────────────────────────────────┘

STEP 1: CITY PROFILE INITIALIZATION
   ├─ Location: core/cities.py
   ├─ Function: get_city_profile("boston")
   │
   ├─ Returns:
   │  ├─ city_key = "boston"
   │  ├─ city_name = "Boston"
   │  ├─ region = "Northeast US"
   │  ├─ population = "675k"
   │  ├─ baseline_temp_c = 33.8°C (92°F - baseline heat)
   │  ├─ canopy_coverage = "27%" (tree coverage)
   │  ├─ crs = "EPSG:26986" (coordinate system)
   │  └─ boundary_candidates = [
   │      "data/boston_boundary_precise.geojson",
   │      "data/boston_boundary.geojson"
   │     ]
   │
   └─ Status: ✅ Hardcoded in registry
   
STEP 2: BOUNDARY LOADING
   ├─ Location: core/city_maps.py (_load_json)
   ├─ Process:
   │  1. Find boundary file from candidates
   │  2. Load GeoJSON from disk
   │  3. Parse geographic features
   │  4. Extract polygon coordinates
   │
   ├─ Output: GeoJSON FeatureCollection
   │  {
   │    "type": "FeatureCollection",
   │    "features": [
   │      {
   │        "type": "Feature",
   │        "geometry": {"type": "Polygon", "coordinates": [...]}
   │        "properties": {"name": "Boston", ...}
   │      }
   │    ]
   │  }
   │
   └─ Used for: Map extent & boundary visualization

STEP 3: SPECTRAL ANALYSIS (Heat Pattern Detection)
   ├─ Location: core/city_maps.py (_normalize_spectral_properties)
   ├─ Algorithm: Spectral partitioning using Cheeger cuts
   ├─ Process:
   │  1. Load Cheeger bottleneck GeoJSON
   │  2. Normalize priority scores (0-100)
   │  3. Classify regions: HIGH/MEDIUM/LOW priority
   │  4. Add severity labels to each feature
   │
   ├─ Classification Logic:
   │  ├─ HIGH: Score >= 75 (Critical intervention zones)
   │  ├─ MEDIUM: Score 25-74 (Important areas)
   │  └─ LOW: Score < 25 (Less critical)
   │
   ├─ Output Properties Added:
   │  ├─ canonical_score = numeric priority
   │  ├─ canonical_class = "High" | "Medium" | "Low"
   │  ├─ severity_bucket = "high" | "medium" | "low"
   │
   └─ Purpose: Identify where interventions matter most

STEP 4: COOLING ACCESS ANALYSIS
   ├─ Location: core/city_maps.py
   ├─ Process:
   │  1. Load cooling_access data
   │  2. Normalize scores (inverted: low score = good access)
   │  3. Identify "cooling deserts" (poor access zones)
   │  4. Cross-reference with Cheeger zones
   │
   ├─ Score Meaning:
   │  ├─ 0-25: Good cooling access ✅
   │  ├─ 25-75: Moderate access ⚠️
   │  └─ 75-100: Poor access (cooling desert) 🔥
   │
   └─ Combined View: Where is heat + no cooling?

STEP 5: FEATURE ENRICHMENT
   ├─ Location: core/city_maps.py
   ├─ Adds to each data point:
   │  ├─ Stable feature IDs (for tracking)
   │  ├─ Cell IDs (grid reference)
   │  ├─ Severity classifications
   │  ├─ Priority rankings
   │  └─ Statistical aggregates
   │
   └─ Purpose: Enable filtering & sorting on frontend

STEP 6: DATA AGGREGATION & CACHING
   ├─ Location: core/city_experience.py
   ├─ Function: resolve_city_experience("boston")
   ├─ Loads all Boston data:
   │  ├─ Boundary artifact
   │  ├─ Cheeger bottleneck artifact
   │  ├─ Cooling access artifact
   │  ├─ Study cards & guides
   │  ├─ Starter scenarios
   │  └─ Intervention templates
   │
   ├─ Caching: Results stored in memory for speed
   └─ Time: ~100-500ms for first load

```

---

## 🗄️ STAGE 3: DATA STORAGE

### Where is processed data kept?

```
┌───────────────────────────────────────────────────────────────┐
│                  DATA STORAGE ARCHITECTURE                    │
└───────────────────────────────────────────────────────────────┘

TIER 1: FILE SYSTEM (source of truth)
   ├─ Location: data/ directory
   ├─ Files:
   │  ├─ *.geojson files (boundaries, overlays, bottlenecks)
   │  ├─ *.json files (interventions, costs)
   │  └─ metadata/ subdirectory (data metadata)
   │
   ├─ Characteristics:
   │  ├─ Persistent (survives restarts)
   │  ├─ Version-controlled (in git)
   │  ├─ Human-readable (JSON format)
   │  └─ Large files OK (up to ~1MB per file)
   │
   └─ Access Pattern: Loaded once at startup

TIER 2: PYTHON MEMORY CACHE
   ├─ Location: core/ services (in-process memory)
   ├─ Mechanism:
   │  ├─ City profiles cached in _CITY_REGISTRY
   │  ├─ City experiences cached with @lru_cache
   │  ├─ Spectral analyses cached
   │  └─ Computed results stored in memory
   │
   ├─ Characteristics:
   │  ├─ Fast access (microseconds)
   │  ├─ Lost on restart
   │  ├─ Single instance per Python process
   │  └─ Thread-safe with locking
   │
   └─ Performance: 1000x faster than disk

TIER 3: API RESPONSE CACHE
   ├─ Location: api/main.py (FastAPI)
   ├─ Mechanism:
   │  ├─ GET endpoints with response caching headers
   │  ├─ City data responses cached for 1 hour
   │  ├─ Overlay data cached for 30 minutes
   │  └─ Scenario results cached per ID
   │
   ├─ Headers Sent:
   │  ├─ Cache-Control: max-age=3600
   │  └─ ETag: (hash of content)
   │
   └─ Browser Cache: Clients can cache responses

TIER 4: FRONTEND STATE MANAGEMENT
   ├─ Location: React components (web/src/)
   ├─ Mechanism:
   │  ├─ State stored in component props/hooks
   │  ├─ Map layer visibility state
   │  ├─ Selected features cached
   │  └─ User preferences in localStorage
   │
   ├─ Characteristics:
   │  ├─ Per-session (lost on page refresh)
   │  ├─ Optional localStorage persistence
   │  └─ Synchronous access
   │
   └─ Purpose: Smooth user interactions

```

---

## 📡 STAGE 4: API DELIVERY

### How does data flow from backend to frontend?

```
┌───────────────────────────────────────────────────────────────┐
│                 FASTAPI REST ENDPOINTS                        │
└───────────────────────────────────────────────────────────────┘

ENDPOINT 1: GET /api/v1/cities
   ├─ Purpose: List all available cities
   ├─ Response:
   │  {
   │    "cities": [
   │      {
   │        "key": "boston",
   │        "name": "Boston",
   │        "region": "Northeast US",
   │        "population": "675k",
   │        "readiness": "fully_bundled",  ✅ Boston is ready!
   │        "requiresUploadedBoundary": false
   │      },
   │      { "key": "new-york-city", ... },
   │      { "key": "chicago", ...},
   │      ...
   │    ]
   │  }
   │
   └─ Status: 200 OK

ENDPOINT 2: GET /api/v1/cities/boston
   ├─ Purpose: Get complete Boston map data
   ├─ Query Parameters: (optional)
   │  └─ include=overlays,boundary,thermal
   │
   ├─ Response: CityMapData Object
   │  {
   │    "cityKey": "boston",
   │    "cityName": "Boston",
   │    "baseline": {
   │      "tempC": 33.8,
   │      "tempF": 92.8
   │    },
   │    "boundary": { /* GeoJSON polygon */ },
   │    "overlays": [
   │      {
   │        "id": "cheeger_bottleneck",
   │        "label": "Cheeger Bottleneck",
   │        "type": "heat",
   │        "scoreKey": "priority",
   │        "features": [ /* 100+ grid cells */ ]
   │      },
   │      {
   │        "id": "cooling_access",
   │        "label": "Cooling Access",
   │        "type": "cooling",
   │        "scoreKey": "cooling_access",
   │        "features": [ /* 100+ grid cells */ ]
   │      }
   │    ],
   │    "thermalSources": [ /* if available */ ]
   │  }
   │
   ├─ Data Size: 500 KB - 2 MB (depending on detail level)
   └─ Load Time: 100-500ms

ENDPOINT 3: GET /api/v1/cities/boston/scenarios
   ├─ Purpose: Get pre-built planning scenarios
   ├─ Response:
   │  {
   │    "scenarios": [
   │      {
   │        "id": "baseline_scenario",
   │        "label": "Baseline (No Interventions)",
   │        "budget": 0,
   │        "interventions": []
   │      },
   │      {
   │        "id": "low_cost_scenario",
   │        "label": "Low Cost ($100k)",
   │        "budget": 100000,
   │        "interventions": [
   │          { "type": "tree_planting", "count": 50, "cost": 2000 },
   │          { "type": "cool_roof", "count": 10, "cost": 50000 }
   │        ]
   │      },
   │      { /* More scenarios */ }
   │    ]
   │  }
   │
   └─ Status: 200 OK

ENDPOINT 4: POST /api/v1/scenarios
   ├─ Purpose: Save or evaluate custom scenario
   ├─ Request:
   │  {
   │    "cityKey": "boston",
   │    "interventions": [
   │      { "location": {"lat": 42.36, "lng": -71.06}, "type": "tree" },
   │      { "location": {"lat": 42.35, "lng": -71.07}, "type": "cool_roof" }
   │    ]
   │  }
   │
   ├─ Response:
   │  {
   │    "scenarioId": "user_scenario_12345",
   │    "totalCost": 25000,
   │    "estimatedHeatReduction": 2.3,  // degrees C reduction
   │    "equityScore": 78,  // who benefits?
   │    "interventions": [ /* your interventions */ ]
   │  }
   │
   └─ Status: 201 Created

ENDPOINT 5: GET /api/v1/runs/{runId}
   ├─ Purpose: Get results of a completed run/analysis
   ├─ Response:
   │  {
   │    "runId": "run_12345",
   │    "cityKey": "boston",
   │    "status": "completed",
   │    "results": {
   │      "heatReductionEstimate": 2.5,
   │      "equityImpact": "high",
   │      "costPerDegree": 15000,
   │      "timestamp": "2024-11-26T12:00:00Z"
   │    }
   │  }
   │
   └─ Status: 200 OK

```

