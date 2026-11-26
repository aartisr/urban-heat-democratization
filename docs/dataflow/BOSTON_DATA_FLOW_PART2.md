## 🎨 STAGE 5: VISUALIZATION (FRONTEND)

### How is the data displayed to users?

```
┌───────────────────────────────────────────────────────────────┐
│          REACT MAP RENDERING PIPELINE (Frontend)              │
└───────────────────────────────────────────────────────────────┘

STEP 1: DATA FETCHING
   ├─ Location: web/src/lib/api.ts
   ├─ Function: loadCityData("boston")
   ├─ Mechanism:
   │  1. HTTP GET /api/v1/cities/boston
   │  2. Browser decompresses response
   │  3. JSON parsed into JavaScript objects
   │  4. Data stored in React state
   │
   ├─ What's Fetched:
   │  ├─ Boundary (city outline polygon)
   │  ├─ Cheeger bottleneck overlay (100+ heat priority cells)
   │  ├─ Cooling access overlay (100+ cooling score cells)
   │  ├─ Thermal sources (optional live data)
   │  └─ Scenario templates
   │
   └─ Performance: ~1-3 seconds for complete load

STEP 2: MAP INITIALIZATION
   ├─ Location: web/src/components/city-heat-map.tsx
   ├─ Library: MapLibre GL (open-source Mapbox alternative)
   ├─ Process:
   │  1. Create map container div
   │  2. Initialize MapLibre with:
   │     ├─ Starting center: Boston lat/lng
   │     ├─ Zoom level: 11 (city-level)
   │     ├─ Base map layer (OpenStreetMap)
   │     └─ Available CRS (coordinate reference system)
   │  3. Set up mouse/touch event handlers
   │  4. Create layer groups for overlays
   │
   ├─ Initial Bounds:
   │  ├─ West: -71.19°
   │  ├─ East: -70.99°
   │  ├─ North: 42.40°
   │  └─ South: 42.23°
   │
   └─ Ready: Map visible, interactable

STEP 3: LAYER RENDERING
   ├─ Location: web/src/components/city-heat-map.tsx
   ├─ Process: Add data layers on top of base map
   │
   ├─ LAYER 1: BOUNDARY LAYER
   │  ├─ ID: "boston-boundary"
   │  ├─ Type: Fill polygon
   │  ├─ Styling:
   │  │  ├─ Fill color: Transparent blue
   │  │  ├─ Outline: Dark gray (2px)
   │  │  ├─ Z-index: 10
   │  │  └─ Interaction: Highlight on hover
   │  └─ GeoJSON Source: boundary artifact
   │
   ├─ LAYER 2: CHEEGER BOTTLENECK (Heat Priority)
   │  ├─ ID: "heat-layer" or "bottleneck-layer"
   │  ├─ Type: Circle or heatmap visualization
   │  ├─ Styling (by severity):
   │  │  ├─ HIGH (score 75-100):   Red (#E74C3C)
   │  │  ├─ MEDIUM (score 25-74):  Orange (#F39C12)
   │  │  └─ LOW (score 0-24):      Yellow (#F1C40F)
   │  │
   │  ├─ Size: Radius 15-25 pixels (cell-dependent)
   │  ├─ Opacity: 0.7 (semi-transparent)
   │  ├─ Z-index: 20
   │  ├─ Interaction:
   │  │  ├─ Click: Show cell details
   │  │  ├─ Hover: Highlight and show tooltip
   │  │  └─ Hover text: "Priority: 85/100 (HIGH)"
   │  │
   │  └─ GeoJSON Source: cheeger_bottleneck artifact
   │
   ├─ LAYER 3: COOLING ACCESS (Cooling Desert)
   │  ├─ ID: "cooling-layer"
   │  ├─ Type: Circle or heatmap visualization
   │  ├─ Styling (by access level):
   │  │  ├─ POOR (score 75-100):   Purple (#8E44AD)
   │  │  ├─ MODERATE (25-74):      Blue (#3498DB)
   │  │  └─ GOOD (0-24):           Green (#27AE60)
   │  │
   │  ├─ Size: Radius 15-25 pixels
   │  ├─ Opacity: 0.5-0.7
   │  ├─ Z-index: 15
   │  ├─ Interaction:
   │  │  ├─ Click: Show cooling data
   │  │  └─ Hover: Show tooltip "Cooling Access: 82/100 (POOR)"
   │  │
   │  └─ GeoJSON Source: cooling_access artifact
   │
   ├─ LAYER 4: THERMAL SOURCES (Optional Live)
   │  ├─ ID: "thermal-sources-layer"
   │  ├─ Type: Circle markers with icons
   │  ├─ Styling:
   │  │  ├─ Icon: Flame emoji 🔥
   │  │  ├─ Color: Bright red (#FF4444)
   │  │  ├─ Size: 25px diameter
   │  │  └─ Z-index: 25
   │  │
   │  ├─ Interaction:
   │  │  ├─ Click: Show source details
   │  │  └─ Hover: Show temperature/intensity
   │  │
   │  └─ GeoJSON Source: live_thermal_sources.json (if available)
   │
   ├─ LAYER 5: SCENARIO INTERVENTIONS (If Scenario Active)
   │  ├─ ID: "scenario-layer"
   │  ├─ Type: Circle markers with icons
   │  ├─ Styling:
   │  │  ├─ Tree interventions: 🌳 green
   │  │  ├─ Cool roof: 🏠 blue
   │  │  ├─ Water feature: 💧 cyan
   │  │  └─ Size: 20px diameter
   │  │
   │  ├─ Interaction:
   │  │  ├─ Click: Edit or delete
   │  │  ├─ Hover: Show type & cost
   │  │  └─ Drag: Relocate intervention
   │  │
   │  └─ GeoJSON Source: User-created scenario
   │
   └─ All layers: Toggleable visibility

STEP 4: INTERACTIVITY LAYER
   ├─ Location: web/src/components/city-heat-map.tsx
   ├─ Features:
   │
   ├─ 🖱️ MOUSE EVENTS:
   │  ├─ Click on cell: Show details popup
   │  │  Content:
   │  │  ├─ Cell ID
   │  │  ├─ Heat priority score
   │  │  ├─ Cooling access score
   │  │  ├─ Latitude/Longitude
   │  │  └─ Recommended interventions
   │  │
   │  ├─ Hover on cell: Highlight + tooltip
   │  │  ├─ Tooltip shows: "Priority: 87, Cooling: 72"
   │  │  └─ Cell gets glow effect
   │  │
   │  └─ Drag map: Pan and explore
   │
   ├─ 🎨 FILTERING:
   │  ├─ Severity filter: ALL / HIGH / MEDIUM / LOW
   │  ├─ Layer toggle: Show/hide each overlay
   │  ├─ Opacity slider: Adjust transparency (0-100%)
   │  └─ Real-time: Layers update instantly
   │
   ├─ 🔍 ZOOM:
   │  ├─ Scroll wheel: Zoom in/out
   │  ├─ Zoom level 1-18:
   │  │  ├─ 11: Default (see whole Boston)
   │  │  ├─ 14-15: Neighborhood level (see clusters)
   │  │  └─ 16-18: Street level (see individual cells)
   │  │
   │  └─ Auto-fit: Double-click boundary
   │
   ├─ 📍 LOCATION SERVICES:
   │  ├─ Geocoding: Search for address
   │  ├─ Reverse geocoding: Click → address
   │  └─ Current location: GPS button
   │
   └─ ⌨️ KEYBOARD SHORTCUTS:
      ├─ R: Reset map to default view
      ├─ H: Show/hide heat layer
      ├─ C: Show/hide cooling layer
      ├─ ? : Show help menu
      └─ ESC: Close popups

STEP 5: CONTROL PANEL
   ├─ Location: Right sidebar (web/src/components/)
   ├─ Sections:
   │
   ├─ SECTION 1: LAYER MANAGER
   │  ├─ Layers List:
   │  │  ├─ ☑ Heat Priority (Cheeger Bottleneck)
   │  │  ├─ ☑ Cooling Access
   │  │  ├─ ☐ Thermal Sources
   │  │  └─ ☐ Interventions
   │  │
   │  └─ Toggles: Check/uncheck to show/hide
   │
   ├─ SECTION 2: FILTER CONTROLS
   │  ├─ Severity Filter:
   │  │  ├─ ◉ All   ◯ High   ◯ Medium   ◯ Low
   │  │  └─ Shows only selected severity levels
   │  │
   │  ├─ Opacity Slider:
   │  │  ├─ Heat layer: [████████░░] 80%
   │  │  ├─ Cooling layer: [██████░░░░] 60%
   │  │  └─ Each layer independent
   │  │
   │  └─ Search Box:
   │     ├─ Search by address or coordinates
   │     └─ Results: "42.36°N, 71.06°W - Downtown Boston"
   │
   ├─ SECTION 3: ANALYSIS PANEL
   │  ├─ Current Selection:
   │  │  ├─ Cell ID: "heat-cell-0045"
   │  │  ├─ Heat Priority: 87/100 (HIGH)
   │  │  ├─ Cooling Access: 72/100 (POOR)
   │  │  ├─ Population: ~450 residents
   │  │  └─ Recommended Actions:
   │  │     ├─ Tree planting ($2,000)
   │  │     ├─ Green roof ($15,000)
   │  │     └─ Water feature ($8,000)
   │  │
   │  └─ Area Statistics:
   │     ├─ Total area: 89.6 km²
   │     ├─ High priority cells: 143
   │     ├─ Cooling deserts: 67
   │     └─ Avg temperature: 33.8°C
   │
   ├─ SECTION 4: SCENARIO BUILDER
   │  ├─ Scenario Selection:
   │  │  ├─ ◉ Baseline (No interventions)
   │  │  ├─ ◯ Low Cost ($100k)
   │  │  ├─ ◯ Medium ($250k)
   │  │  └─ ◯ Custom
   │  │
   │  ├─ Budget Info:
   │  │  ├─ Budget: $250,000
   │  │  ├─ Used: $180,000 (72%)
   │  │  ├─ Remaining: $70,000 (28%)
   │  │  └─ Cost per degree reduction: $15,000
   │  │
   │  ├─ Interventions in this scenario:
   │  │  ├─ Tree planting: 150 trees ($30,000)
   │  │  ├─ Cool roofs: 25 buildings ($100,000)
   │  │  ├─ Water features: 2 ponds ($50,000)
   │  │  └─ Total impact: 2.5°C reduction
   │  │
   │  └─ Actions:
   │     ├─ [+ Add Intervention]
   │     ├─ [🔄 Calculate Impact]
   │     └─ [💾 Save Scenario]
   │
   └─ SECTION 5: EXPORT & SHARE
      ├─ Export options:
      │  ├─ [📥 Download Map (PNG)]
      │  ├─ [📥 Download Data (GeoJSON)]
      │  ├─ [📥 Download Report (PDF)]
      │  └─ [📥 Download Scenario (JSON)]
      │
      └─ Share:
         ├─ [🔗 Copy Link]
         ├─ [📧 Email]
         └─ [🐦 Twitter]

STEP 6: PERFORMANCE OPTIMIZATION
   ├─ Location: web/src/components/, web/src/lib/
   ├─ Techniques:
   │
   ├─ LAYER CLUSTERING:
   │  ├─ At zoom < 12: Show clusters of cells
   │  ├─ At zoom 12-14: Show larger grid cells
   │  ├─ At zoom 15+: Show individual cells
   │  └─ Purpose: Reduce rendered features
   │
   ├─ VIEWPORT CULLING:
   │  ├─ Only render visible cells
   │  ├─ Cells outside map bounds: ignored
   │  └─ Purpose: Faster pan/zoom
   │
   ├─ MEMOIZATION:
   │  ├─ React.memo() for components
   │  ├─ useMemo() for computed values
   │  └─ useCallback() for event handlers
   │
   ├─ DATA CACHING:
   │  ├─ City data: Cached for 1 hour
   │  ├─ Scenario results: Cached per ID
   │  └─ Maps tiles: Browser cache (HTTP headers)
   │
   └─ VIRTUAL SCROLLING:
      ├─ For long lists in control panel
      ├─ Only render visible items
      └─ Purpose: Smooth scrolling

```

---

## 🔄 COMPLETE DATA FLOW SEQUENCE DIAGRAM

```
USER OPENS APP
     ↓
  [FRONTEND]                    [BACKEND]
     ↓                               ↓
Browser Loads app              App starts up
   ↓                               ↓
React mounts              City profiles loaded
   ↓                      Boundaries cached
Initialize map               ↓
   ↓                     Ready to serve
   ├──────────────────→ GET /api/v1/cities ──────────────────┐
   │                                                          ↓
   │                                                 Return city list
   │                                                 (Boston = ready)
   │                                                          ↓
   │←─────────────────── City list received ─────────────────┤
   │
   ├──────────────────→ GET /api/v1/cities/boston ───────────┐
   │                   (fetch complete data)                 ↓
   │                                                 Load boundary
   │                                                 Normalize overlays
   │                                                 Enrich features
   │                                                 Cache result
   │                                                          ↓
   │←─────────────────── CityMapData JSON ──────────────────┤
   │ (500 KB - 2 MB)
   │
   ├─ Parse JSON
   │ ├─ Extract boundary coordinates
   │ ├─ Extract Cheeger bottleneck cells
   │ ├─ Extract cooling access cells
   │ └─ Extract metadata
   │
   ├─ Create GeoJSON data sources
   │ ├─ MapLibre GeoJSONSource (boundary)
   │ ├─ MapLibre GeoJSONSource (heat layer)
   │ ├─ MapLibre GeoJSONSource (cooling layer)
   │ └─ MapLibre GeoJSONSource (thermal sources)
   │
   ├─ Render layers
   │ ├─ Add boundary fill layer
   │ ├─ Add heat priority circles (red/orange/yellow)
   │ ├─ Add cooling access circles (purple/blue/green)
   │ └─ Add optional thermal source markers
   │
   ├─ Attach event listeners
   │ ├─ map.on('click', 'heat-layer', showPopup)
   │ ├─ map.on('mousemove', highlightCell)
   │ ├─ map.on('mouseleave', unhighlightCell)
   │ └─ map.on('zoom', updateClustering)
   │
   └─ Map is INTERACTIVE
      └─ User can:
         ├─ Click cells to see details
         ├─ Hover for tooltips
         ├─ Zoom in/out
         ├─ Pan around
         ├─ Toggle layers on/off
         ├─ Filter by severity
         ├─ Adjust opacity
         └─ Build scenarios

   [USER CLICKS ON HEAT CELL]
        ↓
   Cell ID: "heat-0045"
   Trigger: map.on('click', 'heat-layer')
        ↓
   showPopup() function
        ↓
   Extract cell properties
   ├─ priority score: 87
   ├─ priority_class: "High"
   ├─ cooling_access: 72
   └─ access_class: "Poor"
        ↓
   Create Popup HTML
        ↓
   Show on map
        ↓
   User sees:
   ┌─────────────────────┐
   │  Heat Priority Cell │
   │ ───────────────────│
   │ Priority: 87/100   │
   │ (HIGH)             │
   │                   │
   │ Cooling Access: 72 │
   │ (POOR)             │
   │                   │
   │ Recommended:       │
   │ • Tree planting    │
   │ • Cool roofs       │
   │ • Green space      │
   │                   │
   │ [Zoom to cell]     │
   │ [Add intervention] │
   └─────────────────────┘

   [USER CREATES CUSTOM SCENARIO]
        ↓
   User clicks: "+ Add Intervention"
        ↓
   Map enters edit mode
        ↓
   User clicks map location
        ↓
   showPlacementDialog("tree_planting")
        ↓
   User selects:
   ├─ Intervention type: Tree
   ├─ Count: 50 trees
   ├─ Location: [42.36, -71.06]
   └─ Cost: $2,000
        ↓
   Add to scenario state
        ↓
   Map updates: Show tree marker
        ↓
   User clicks: "Calculate Impact"
        ↓
   POST /api/v1/scenarios
        │
        ├──────────────────→ [Backend calculates] ───────────────────┐
        │                                                              ↓
        │                                              Analyze scenario
        │                                              ├─ Run simulations
        │                                              ├─ Calculate heat reduction
        │                                              ├─ Assess equity impact
        │                                              ├─ Compute total cost
        │                                              └─ Store results
        │                                              
        │←─────────────────── ScenarioResult JSON ──────────────────┤
        │ {
        │   "scenarioId": "user_scenario_xyz",
        │   "totalCost": 2000,
        │   "heatReduction": 0.5,
        │   "equityScore": 85,
        │   "interventions": [...]
        │ }
        │
        ├─ Parse results
        ├─ Update UI: Show impact metrics
        ├─ Highlight affected cells
        └─ Show ROI calculation

USER DOWNLOADS REPORT
        ↓
   User clicks: "📥 Download Report (PDF)"
        ↓
   Frontend prepares data
        ├─ Scenario data
        ├─ Map screenshot
        ├─ Impact analysis
        ├─ Cost breakdown
        └─ Intervention details
        ↓
   PDF generated in browser
        ↓
   Browser downloads file
        ↓
   Report saved locally

```

---

## 🎓 KEY CONCEPTS EXPLAINED

### What is CHEEGER's BOTTLENECK?

```
Think of Boston as a network where:
  • HEAT flows through the city
  • COOLING resources are scattered
  • Some areas are "bottlenecks" - trapped heat can't escape

The Cheeger algorithm identifies these bottlenecks by:
  1. Building a graph of heat flow
  2. Finding cuts that separate heat from cooling
  3. Scoring by "conductance" (how good the separation is)
  4. Identifying weakest points (best intervention sites)

Result: Heat Priority Score (0-100)
  • 100 = Critical bottleneck (heat trapped, no cooling)
  • 50 = Moderate (some flow, some cooling)
  • 0 = Good (heat can escape, cooling available)
```

### What is COOLING ACCESS?

```
Cooling access measures how close each area is to:
  • Parks and green spaces
  • Water bodies (lakes, rivers)
  • Tree-covered areas
  • Other "cool" features

Scoring (inverted):
  • 0-25: Good access ✅ (parks nearby, trees, water)
  • 25-75: Moderate access ⚠️ (some cooling, but limited)
  • 75-100: Poor access 🔥 (cooling desert - no parks/trees/water)

Strategic insight:
  High heat priority + Poor cooling access = URGENT intervention area
```

---

## 📊 DATA VOLUME REFERENCE

```
File                                    Size        Impact
─────────────────────────────────────────────────────────────
boston_boundary_precise.geojson        675 KB      Detailed city outline
cheeger_bottleneck.geojson             150 KB      Heat priority grid
cooling_access_zones.geojson           388 KB      Cooling access grid
intervention_catalog.json              8 KB        What can be done
intervention_costs.json                6 KB        How much it costs
live_thermal_sources.json              2 KB        Optional live data
─────────────────────────────────────────────────────────────
Total main data transfer              ~1.2 MB
Compressed (gzip)                      ~300 KB
─────────────────────────────────────────────────────────────

Network Performance:
  • 1.2 MB on 10 Mbps: ~1 second
  • 1.2 MB on 4G (20 Mbps): ~0.5 seconds
  • 1.2 MB on 5G (100+ Mbps): ~0.1 seconds

Rendering Performance:
  • 100+ features per layer
  • 300+ total features
  • MapLibre clusters at zoom < 12
  • Individual cells visible at zoom 15+
  • 60 FPS on modern browsers
```

---

## 🚀 OPTIMIZATION TIPS

```
For FASTER LOADING:
  1. Use simplified boundary (64 KB not 675 KB) for zoom < 14
  2. Lazy-load thermal sources only if requested
  3. Cache responses in browser (HTTP headers set)
  4. Use gzip compression (saves 75%)
  5. CDN the GeoJSON files

For BETTER INTERACTIVITY:
  1. Use layer clustering at zoom < 12
  2. Viewport culling (don't render off-screen cells)
  3. React memoization (avoid re-renders)
  4. Virtual scrolling for long lists
  5. Debounce zoom/pan events

For MORE FEATURES:
  1. Add comparison mode (baseline vs scenario)
  2. Time-lapse animation (heat over seasons)
  3. 3D terrain view
  4. Street-level heat routing
  5. Real-time sensor integration
```

