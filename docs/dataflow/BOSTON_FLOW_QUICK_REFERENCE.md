# 🗺️ BOSTON DATA FLOW - QUICK VISUAL REFERENCE

## ONE-PAGE OVERVIEW

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                     BOSTON HEAT MAP - DATA JOURNEY                       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

                            🎯 5 STAGES PIPELINE

┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│   STAGE 1       │    │   STAGE 2        │    │   STAGE 3      │
│  DATA SOURCES   │───→│  PROCESSING      │───→│   STORAGE      │
│                 │    │   (Python)       │    │                │
└─────────────────┘    └──────────────────┘    └────────────────┘
        ↓                       ↓                       ↓
  Where data            Backend algorithms         Where data
  comes from            normalize & enrich         is kept
  
         Files:                Functions:              Tiers:
  • Boundaries        • Load GeoJSON         • File system
  • Heat maps         • Classify scores      • Python cache
  • Cooling data      • Normalize values     • API cache
  • Cheeger scores    • Enrich features      • Browser cache


         ↓                       ↓                       ↓

    ┌──────────────────┐    ┌──────────────────┐
    │   STAGE 4        │    │   STAGE 5        │
    │  API DELIVERY    │───→│ VISUALIZATION    │
    │  (FastAPI REST)  │    │  (React + Map)   │
    └──────────────────┘    └──────────────────┘
            ↓                       ↓
     REST API endpoints      Interactive map
     JSON responses          with layers & tools
     
         Endpoints:              Components:
  • GET /api/v1/cities       • MapLibre GL
  • GET /api/v1/cities/boston • Layer manager
  • POST /api/v1/scenarios   • Control panel
  • GET /api/v1/runs         • Popups & tooltips


═══════════════════════════════════════════════════════════════════════════════
```

---

## 🎨 WHAT YOU SEE ON THE MAP

```
                        BOSTON MAP DISPLAY
                        
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  🗺️  [Streets & Base Map (OpenStreetMap)]                   │
│                                                              │
│    ┌─────────────────────────────────────────────────────┐  │
│    │ BOSTON BOUNDARY (city outline)                      │  │
│    │                                                     │  │
│    │  🔴🔴🔴 🟠🟠 🟡🟡🟡  ← HEAT PRIORITY CELLS      │  │
│    │  RED = HIGH (75-100)    Heat trapped, needs help  │  │
│    │  ORANGE = MEDIUM (25-74) Some heat stress         │  │
│    │  YELLOW = LOW (0-24)    Heat manageable           │  │
│    │                                                     │  │
│    │  🟣🟣 🔵🔵🔵🔵 🟢🟢      ← COOLING ACCESS       │  │
│    │  PURPLE = POOR (75-100)  No parks/trees/water    │  │
│    │  BLUE = MODERATE (25-74) Some cooling available  │  │
│    │  GREEN = GOOD (0-24)     Lots of cooling         │  │
│    │                                                     │  │
│    │  🔥🔥 🔥                 ← THERMAL SOURCES       │  │
│    │  Heat-emitting locations (buildings, etc)         │  │
│    │                                                     │  │
│    │  🌳 🏘️ 💧                ← INTERVENTIONS        │  │
│    │  User-placed solutions (trees, roofs, water)      │  │
│    │                                                     │  │
│    └─────────────────────────────────────────────────────┘  │
│                                                              │
│  LEGEND                    CONTROLS                ANALYSIS  │
│  ☑ Heat Priority    Zoom [+/−]  Severity:  Cell Data:     │
│  ☑ Cooling Access   Pan ← → ↑ ↓ ◉ All      Priority: 87   │
│  ☐ Thermal Sources  Search []   ◯ High     Cooling: 72    │
│  ☐ Interventions    Filter []   ◯ Medium   Pop: 450       │
│                     Opacity:     ◯ Low      Recs: Trees   │
│                     Heat [████]  Cooling[██]              │
│                     Layers [▼]   Scenario[▼]              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 DATA STRUCTURE HIERARCHY

```
CityMapData (What you get from /api/v1/cities/boston)
│
├─ cityKey: "boston"
├─ cityName: "Boston"
│
├─ baseline
│  ├─ tempC: 33.8
│  └─ tempF: 92.8
│
├─ boundary (GeoJSON)
│  └─ FeatureCollection with 1 feature (Boston polygon)
│
├─ overlays[] (Array of data layers)
│  │
│  ├─ Overlay 1: Cheeger Bottleneck
│  │  ├─ id: "cheeger_bottleneck"
│  │  ├─ label: "Cheeger Bottleneck"
│  │  ├─ type: "heat"
│  │  ├─ scoreKey: "priority"
│  │  └─ features[] (100+ cells)
│  │     ├─ Feature 1
│  │     │  ├─ id: "heat-0001"
│  │     │  ├─ properties
│  │     │  │  ├─ priority: 87 (score out of 100)
│  │     │  │  ├─ priority_class: "High"
│  │     │  │  ├─ severity_bucket: "high"
│  │     │  │  └─ ... more properties
│  │     │  └─ geometry (Point or Polygon)
│  │     ├─ Feature 2 { ... }
│  │     └─ ... more features
│  │
│  └─ Overlay 2: Cooling Access
│     ├─ id: "cooling_access"
│     ├─ label: "Cooling Access"
│     ├─ type: "cooling"
│     ├─ scoreKey: "cooling_access"
│     └─ features[] (100+ cells)
│        ├─ Feature 1
│        │  ├─ id: "cooling-0001"
│        │  ├─ properties
│        │  │  ├─ cooling_access: 72
│        │  │  ├─ access_class: "Poor"
│        │  │  └─ ... more properties
│        │  └─ geometry
│        └─ ... more features
│
├─ thermalSources[] (Optional)
│  ├─ Feature 1: Building emitting heat
│  ├─ Feature 2: Pavement heat source
│  └─ ... more sources
│
└─ scenarios[] (Pre-built planning scenarios)
   ├─ Scenario 1: Baseline (no interventions)
   ├─ Scenario 2: Low Cost ($100k)
   ├─ Scenario 3: Medium ($250k)
   └─ Scenario 4: High Impact ($500k)
```

---

## 🔄 KEY DATA TRANSFORMATIONS

```
RAW DATA (Files on disk)              PROCESSED DATA (Python)       API RESPONSE (JSON)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cheeger_bottleneck.geojson          Loaded & parsed          Sent to frontend
(150 KB raw GeoJSON)                       ↓                        ↓
├─ Features with raw scores        Normalize scores (0-100)    {
├─ No classification               Add severity labels        "overlays": [{
└─ No severity info                Add stable IDs              "features": [
                                   Add cell references        {
                                        ↓                      "id": "heat-0001"
                                   Cache in memory          "properties": {
                                        ↓                      "priority": 87
                                   Return in API response      "priority_class": "High"

cooling_access_zones.geojson    Normalize (invert if needed)  "severity_bucket": "high"
(388 KB raw GeoJSON)            Classify: Good/Moderate/Poor     ...
├─ Grid cell features           Add accessibility labels
├─ Raw cooling scores           Enrich with metadata
└─ No class labels              Cache results

boston_boundary.geojson         Load polygon coords
(64 KB simplified)              Extract features
                                Validate geometry
                                Return as-is

                                           ↓
                                      Ready for map!
                                           ↓
                                      MapLibre GeoJSON
                                      Data sources
                                           ↓
                                      Render to canvas
```

---

## ⚡ PERFORMANCE TIMELINE

```
USER OPENS APP
     ↓
   0.0s  Browser requests /api/v1/cities
         Backend starts processing
     ↓
   0.5s  API returns city list
         Frontend shows "Boston - Ready ✅"
     ↓
   0.5s  Browser requests /api/v1/cities/boston
         Backend loads all Boston data (~1.2 MB)
     ↓
   1.5s  API returns complete city data
         Browser decompresses (gzip)
         Frontend begins parsing JSON
     ↓
   2.0s  Map container initialized
         OSM base layer loaded
         GeoJSON sources created
     ↓
   2.5s  Boundary layer rendered
         (outline of Boston appears)
     ↓
   3.0s  Heat layer rendered
         (red/orange/yellow cells appear)
     ↓
   3.3s  Cooling layer rendered
         (purple/blue/green cells appear)
     ↓
   3.5s  Controls + interactivity enabled
         User can click, zoom, pan
     ↓
   3.5s  ✅ MAP FULLY LOADED & INTERACTIVE
         (Total: 3.5 seconds from app open)

Events Per Second:
  - FPS: 60 (smooth animations)
  - Layer updates: Real-time
  - API calls: < 100ms latency
  - Scenario calc: 200-500ms
```

---

## 🎯 CRITICAL FEATURES EXPLAINED

### 1️⃣ CHEEGER BOTTLENECK (Heat Priority)

**What it shows:** Where heat is TRAPPED and can't escape

**How it works:**
1. Graph algorithm models heat flow through Boston
2. Identifies "cuts" (barriers) between heat and cooling
3. Scores how bad each barrier is (conductance)
4. Result: Priority score (0-100)

**Color code:**
- 🔴 RED (75-100): CRITICAL - Heat trapped, no cooling nearby
- 🟠 ORANGE (25-74): MODERATE - Some stress, some cooling
- 🟡 YELLOW (0-24): LOW - Heat can escape or cooling is good

**Why it matters:** Where you should place interventions first

---

### 2️⃣ COOLING ACCESS (Cooling Desert)

**What it shows:** Where COOLING RESOURCES are scarce

**How it works:**
1. Maps parks, trees, water bodies
2. Calculates distance from each area
3. Scores accessibility (0-100)
4. Inverted scale: HIGH score = POOR access

**Color code:**
- 🟣 PURPLE (75-100): POOR - No parks/trees/water nearby
- 🔵 BLUE (25-74): MODERATE - Some cooling available
- 🟢 GREEN (0-24): GOOD - Parks/trees/water abundant

**Why it matters:** Identifies where cooling solutions would help most

---

### 3️⃣ COMBINED VIEW (Heat + Cooling)

**Most urgent areas:** HIGH heat priority + POOR cooling access

**Example:**
- Cell A: Heat=87, Cooling=92 → RED + PURPLE = CRITICAL INTERVENTION
- Cell B: Heat=42, Cooling=15 → YELLOW + GREEN = ALREADY OK
- Cell C: Heat=78, Cooling=22 → RED + GREEN = Heat problem only

---

## 🚀 QUICK START GUIDE

```
1. LOAD THE APP
   → Data loads from: data/ folder → Backend → API → Frontend
   → Status: See Boston map with colored grid

2. UNDERSTAND THE COLORS
   → RED = Heat problem
   → PURPLE = Cooling problem
   → RED + PURPLE = URGENT

3. EXPLORE
   → Click cells to see details
   → Hover to see scores
   → Zoom in for neighborhoods
   → Toggle layers on/off

4. BUILD A SCENARIO
   → Click "Custom Scenario"
   → Click map to add trees 🌳
   → Add cool roofs 🏠
   → Add water features 💧
   → Click "Calculate Impact"
   → See heat reduction estimate

5. EXPORT
   → Download map (PNG)
   → Download data (GeoJSON)
   → Download report (PDF)
   → Share link with colleagues
```

---

## 📞 TROUBLESHOOTING

```
Issue: Map won't load
→ Check: Backend running? API responding? /api/v1/cities returns data?
→ Fix: Restart backend: python api/main.py

Issue: Layers not visible
→ Check: Layer toggle checked? Zoom level high enough?
→ Fix: Click layer checkbox, zoom to level 12+

Issue: Scenario calculation slow
→ Check: Many interventions? Lots of data?
→ Fix: Simplify scenario, upgrade backend server

Issue: Data looks wrong
→ Check: Compare with main-old branch?
→ Fix: Reload page, clear browser cache

Issue: Performance laggy
→ Check: Zoom level? Number of features?
→ Fix: Reduce opacity, zoom out, turn off some layers
```

---

## 📚 WHERE TO FIND DETAILS

```
Document                                What it covers
─────────────────────────────────────────────────────────────
BOSTON_DATA_FLOW_PART1.md              Stages 1-4 (data to API)
BOSTON_DATA_FLOW_PART2.md              Stage 5 (visualization)
MODULARITY.md                          Architecture patterns
FEATURE_DEVELOPMENT.md                 Adding new features
core/cities.py                         City profiles
core/city_maps.py                      Data processing
web/src/components/city-heat-map.tsx   Map rendering
api/main.py                            REST endpoints
```

