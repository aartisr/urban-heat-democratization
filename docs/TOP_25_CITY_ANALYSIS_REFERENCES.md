# Top 25 City Analysis References

This document captures comparable public-facing products that informed the generic city-page redesign in `urban_heat_democratization`.

The goal was not to copy any one product. The goal was to extract reusable patterns from information-dense civic, climate, hazard, and planning interfaces that still guide users naturally.

## What We Looked For

- strong spatial orientation
- clear first action
- progressive disclosure
- trust and provenance signals
- concise decision summaries
- clean transition from observation to action

## Reference List

1. AirNow Fire and Smoke Map  
   https://fire.airnow.gov/
   Why it matters: map-first, fast orientation, immediate usefulness.

2. NOAA HeatRisk  
   https://www.wpc.ncep.noaa.gov/heatrisk/
   Why it matters: layered hazard explanation without a heavy wall of text.

3. EPA EnviroAtlas  
   https://www.epa.gov/enviroatlas
   Why it matters: evidence-rich environmental layers with educational framing.

4. FEMA Map Service Center  
   https://msc.fema.gov/portal/home
   Why it matters: strong task orientation and clear “find your place first” flow.

5. FEMA National Risk Index  
   https://hazards.fema.gov/nri/map
   Why it matters: risk summary paired with map context and county-level exploration.

6. Climate Central Coastal Risk Screening Tool  
   https://coastal.climatecentral.org/
   Why it matters: clean map-to-impact storytelling.

7. EPA EJScreen  
   https://www.epa.gov/ejscreen
   Why it matters: environmental justice context layered with geographic exploration.

8. CDC Environmental Justice Index  
   https://eji.cdc.gov/
   Why it matters: index-style framing that helps users interpret complex signals.

9. CDC Social Vulnerability Index  
   https://www.atsdr.cdc.gov/placeandhealth/svi/index.html
   Why it matters: good precedent for turning technical indicators into public meaning.

10. Cal-Adapt  
    https://cal-adapt.org/
    Why it matters: climate analysis presented as an exploration workflow.

11. NOAA Sea Level Rise Viewer  
    https://coast.noaa.gov/slr/
    Why it matters: intuitive scenario comparison and visible geographic consequence.

12. EPA How’s My Waterway  
    https://mywaterway.epa.gov/
    Why it matters: place-first journey with a natural drill-down pattern.

13. US Drought Monitor  
    https://droughtmonitor.unl.edu/
    Why it matters: strong legend discipline and quick pattern recognition.

14. USGS Earthquake Map  
    https://earthquake.usgs.gov/earthquakes/map/
    Why it matters: dense information presented with a fast “see first, inspect later” rhythm.

15. NASA Earthdata Worldview  
    https://worldview.earthdata.nasa.gov/
    Why it matters: expert-grade data presented through scalable layers and controls.

16. Global Forest Watch  
    https://www.globalforestwatch.org/map/
    Why it matters: high-density geospatial analysis with strong narrative framing.

17. National Equity Atlas  
    https://nationalequityatlas.org/
    Why it matters: data storytelling that reduces overwhelm through clear sectioning.

18. Opportunity Atlas  
    https://www.opportunityatlas.org/
    Why it matters: place-centered comparison with restrained interface complexity.

19. Atlas of ReUrbanism / public planning atlas pattern  
    Why it matters: clear progression from context to intervention opportunity.

20. Urban Institute Data Tools pattern  
    https://www.urban.org/data-tools
    Why it matters: decision support tools that start from user purpose, not raw data.

21. ArcGIS Urban pattern  
    https://www.esri.com/en-us/arcgis/products/arcgis-urban/overview
    Why it matters: scenario and planning context built around map decisions.

22. City Health Dashboard  
    https://www.cityhealthdashboard.com/
    Why it matters: city indicators organized into approachable narrative blocks.

23. NYC Environment and Health Data Portal pattern  
    Why it matters: dense public-health data made accessible through filtering and guided explanation.

24. Resilience Atlas pattern  
    Why it matters: climate adaptation context paired with planning language.

25. Transit and mobility observatory pattern  
    Why it matters: useful precedent for turning complex spatial analytics into an everyday public product.

## Reusable Patterns

### 1. Map First, Then Meaning

The strongest tools let the user orient spatially before they ask them to read a lot.

Applied here:

- hero explains the promise
- map appears early
- explanation follows the map instead of blocking access to it

### 2. One Clear Next Step

Products that convert best do not present ten equally important calls to action.

Applied here:

- a single natural next step
- one suggested starting budget
- a guided path into scenarios

### 3. Progressive Disclosure

The best public tools do not dump provenance, limitations, metrics, and workflows at the very top.

Applied here:

- top: city promise and map
- middle: why it matters and what to do next
- lower: honesty, evidence, readiness, robustness

### 4. Evidence Near the Claim

Trust grows when methodology and caveats sit close to the displayed result.

Applied here:

- atlas verification panel
- evidence and honesty section
- observed / derived / estimated framing

### 5. Small Metrics, Not Big Walls

Good products summarize state in compact numbers, then let users drill in.

Applied here:

- hero metrics
- loaded overlay counts
- concise snapshot metrics

### 6. Action Bridges

The best analytical interfaces bridge observation to action without making the user restart in another part of the app.

Applied here:

- mitigation chips deep-link to scenarios
- city and budget context carry forward

### 7. Generic Structure, Local Content

Scalable civic tools keep the same page skeleton while swapping local content and readiness levels.

Applied here:

- shared city-page overview component
- generic city detail copy
- bundled and upload-first branches inside one reusable structure

## Resulting Layout Standard

The city page should follow this order:

1. city promise
2. journey cards
3. map
4. why it matters
5. natural next step
6. evidence and honesty
7. snapshot and actions
8. guided study workflow
9. readiness and local registration
10. robustness context

## Design Principle

People should feel:

- oriented quickly
- informed without being buried
- trusted with honest caveats
- guided toward action

That is the bar for a reusable city page that can work for Boston today and for future cities later.
