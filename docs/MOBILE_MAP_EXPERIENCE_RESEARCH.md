# Mobile Map Experience Research

## Decision

The mobile atlas uses **question-led map lenses** rather than exposing every technical layer at once.

1. **Where is help needed?** — priority and cooling-gap analysis.
2. **What does the satellite see?** — observed surface heat and corridors.
3. **What could improve it?** — priorities and proposed actions.

Each lens is a deliberate, reversible view. Fine-grained layer controls remain available under **Fine-tune individual layers**. This preserves research capability without making every visitor learn the layer model before they can read the map.

## Comparative reference set

This is a representative reference set, not a claim that these are the universally ranked "top 25." It covers consumer navigation, outdoor exploration, weather, earth observation, civic risk, and professional GIS products with comparable map-density challenges.

| Area | Products reviewed as design references | Pattern carried forward |
| --- | --- | --- |
| Everyday maps | Google Maps, Apple Maps, Waze, HERE WeGo, Mapbox | Keep routine controls small and map-first; use a compact mode selector instead of a persistent legend wall. |
| Place and property search | Airbnb, Zillow, Redfin, Realtor.com, Yelp | Let the map stay visible while a focused card or sheet answers one immediate question. |
| Outdoor exploration | AllTrails, Strava, Komoot, onX, Gaia GPS | Make the current mode obvious; disclose technical overlays after the main route or condition is clear. |
| Weather and environment | Windy, Ventusky, NOAA/NWS, PurpleAir, Electricity Maps | Offer thematic views first; reserve the full layer catalogue for people who intentionally need it. |
| Earth observation and GIS | NASA Worldview, Copernicus Browser, ArcGIS Field Maps, ArcGIS Map Viewer, Felt | Keep powerful layer visibility and filtering, but organise it by purpose and use progressive disclosure. |
| Public-interest risk | FEMA National Risk Index, Climate TRACE, Global Forest Watch, USGS National Map, Climate Central | Lead with the decision-relevant signal, then make provenance, uncertainty, and source detail available without hiding the geography. |

## Evidence behind the interaction model

- Google Maps describes map controls as stationary widgets and supports compact dropdown or horizontal variants rather than requiring every control to remain visible. It also notes that iOS does not support browser fullscreen. [Google Maps controls](https://developers.google.com/maps/documentation/javascript/controls)
- Apple advises keeping maps interactive, avoiding noninteractive elements that obscure the map, using enough contrast for controls, and reducing detail at broader zoom levels. [Apple Maps guidance](https://developer.apple.com/design/human-interface-guidelines/maps)
- ArcGIS Field Maps keeps layers and filters as explicit tools while allowing map authors to include only the layers mobile workers need. [ArcGIS Field Maps tools](https://doc.arcgis.com/en/field-maps/android/use-maps/quick-reference.htm) and [map configuration](https://doc.arcgis.com/en/field-maps/latest/prepare-maps/configure-the-map.htm)
- NASA Worldview demonstrates the power and risk of a comprehensive scientific layer catalogue; it uses an add-layer workflow, explicit visibility, categories, and comparison modes for advanced exploration. [NASA Worldview](https://worldview.earthdata.nasa.gov/) and [Worldview guide](https://earthdata.nasa.gov/s3fs-public/imported/2019_Worldview_4Pager_RevNov2019.pdf)
- WCAG 2.2 sets a 24 by 24 CSS-pixel minimum pointer target at AA; 44 by 44 is the enhanced target. Apple likewise recommends generously sized, well-spaced touch controls. [WCAG 2.2](https://www.w3.org/TR/wcag/) and [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility)

## Implemented experience

- **Calm default:** the initial map shows the decision-facing priority lens, not every available overlay.
- **One choice, three outcomes:** a person can enter the layer experience by choosing a question in plain language, with a short evidence description underneath.
- **Visible state:** the compact map button names the active lens, so a demo facilitator and a first-time visitor can immediately explain what the map shows.
- **Power without clutter:** the existing six individual layers stay available in a native disclosure element. Changing one marks the view as **Custom** instead of pretending it is still a preset.
- **Touch safety:** lens cards are large, separated controls; mobile fine-tune controls stack in one column rather than compressing labels into two narrow columns.
- **Honest science:** the UI differentiates derived priority, observed thermal evidence, scenarios, and study scope. A lens changes presentation, not the underlying data or claims.

## Validation checklist

1. On a narrow phone, open **Full page map** and ensure the priority lens is readable without opening controls.
2. Open the current-view button and switch among all three lenses. The map should update immediately and the button label should change.
3. Open **Fine-tune individual layers**, toggle one layer, and confirm the button reads **Custom view**.
4. Verify every primary control is usable with a thumb and the map remains visible while the sheet is open.
5. Test portrait, landscape, Chrome Android, Safari iPhone, keyboard navigation, and a screen reader before public release.
