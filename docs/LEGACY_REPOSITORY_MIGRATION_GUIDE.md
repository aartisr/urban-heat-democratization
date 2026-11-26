# Legacy Repository Migration Guide

This guide helps teams and developers transition from `spectral-urbanism` and `spectral_urbanism_boston` to `urban_heat_democratization`.

---

## Background: Why Consolidate?

The Spectral Urbanism research project evolved through three implementations:

1. **spectral-urbanism** (2024-2026): Interactive Streamlit demo
2. **spectral_urbanism_boston** (2025-2026): Plug-and-play optimization pipeline
3. **urban_heat_democratization** (2024-2026): Production platform combining both

As of November 2026, all features have been consolidated into the main production repository. The legacy repositories are archived for historical reference but are no longer actively maintained.

---

## Transition Timeline

| Phase | Timeline | Status |
|-------|----------|--------|
| **Phase 1: Documentation** | Before archival | In progress |
| **Phase 2: Archival** | Immediate after team approval | Pending |
| **Phase 3: Maintenance** | Long-term | Legacy repos remain readable, closed to changes |

---

## For Existing Users

### If You Use spectral-urbanism

#### Current Setup
```bash
# Old way
cd spectral-urbanism
source .venv/bin/activate
python -m streamlit run Home.py
# Opens Streamlit app at localhost:8501
```

#### Migrate to urban_heat_democratization
```bash
# New way
cd urban_heat_democratization
make setup
make api  # Terminal 1
make web  # Terminal 2
# Opens web app at localhost:5173 (more modern, faster)
```

#### Feature Mapping

| spectral-urbanism Feature | urban_heat_democratization Equivalent |
|---------------------------|---------------------------------------|
| **Home Page** | Web app home tab (same content, better design) |
| **Data Page** (raster upload/preview) | Explore → Data section |
| **Results Page** (bottleneck, resistance) | Explore → Results (more interactive) |
| **Theory Page** | Wiki → Science & Interpretation |
| **Mitigation Costs** | Mitigation Lab (interactive browser) |
| **Export PDF** | Export tab → Download PDF |
| **Configuration** | City selector + onboarding flow (GUI) |
| **Analysis** | Atlas layer toggles + scenario comparison |

#### Key Differences

| Aspect | spectral-urbanism | urban_heat_democratization |
|--------|-------------------|----------------------------|
| **UI Framework** | Streamlit (Python-driven) | React (web-first) |
| **Interaction** | Server restarts on input changes | Instant browser responses |
| **Maps** | Folium (raster-focused) | MapLibre GL (vector-rich) |
| **Scenarios** | Export only | Interactive comparison |
| **Mobile** | Poor support | Responsive design |
| **Offline** | Server required | Works offline (web) |

---

### If You Use spectral_urbanism_boston

#### Current Setup (Plug-and-Play Pipeline)
```bash
# Old way: Run via CLI or config
cd spectral_urbanism_boston
source .venv/bin/activate

# CLI mode
spectral-urbanism run --config configs/boston.yaml

# Or Docker + Celery
docker compose up
# API at localhost:8000, Web at localhost:5173, Redis at localhost:6379
```

#### Migrate to urban_heat_democratization
```bash
# New way: Web UI + API (simpler, no external queue needed)
cd urban_heat_democratization
make setup
make api  # Terminal 1
make web  # Terminal 2

# Same API surface; submit via web UI or POST /api/v1/runs
# Runs tracked in SQLite (not Redis), results in JSON
```

#### Feature Mapping

| spectral_urbanism_boston | urban_heat_democratization |
|--------------------------|---------------------------|
| **Config-driven pipelines** | City selector in UI + API validation |
| **Multiple cities** | Boston + 4 starter cities + upload |
| **CLI mode** (`spectral-urbanism run`) | Web UI + REST API |
| **Experiment framework** | Runs page + audit log |
| **Fairness audits** | Preserved in research archive (git) |
| **Plugin system** | Config-based approach (simpler) |
| **Redis/Celery workers** | SQLite persistence + inline execution |
| **Benchmarks** | Comparison page (visual charts) |
| **Report generation** | Export tab (PDF, DOCX, GeoJSON) |

#### API Endpoint Compatibility

| Old Endpoint | New Location | Notes |
|--------------|--------------|-------|
| `POST /configs/validate` | `POST /api/v1/configs/validate` | Same schema; uses city profile |
| `POST /runs` | `POST /api/v1/runs` | Same; config embedded, no queue wait |
| `GET /runs/{run_id}` | `GET /api/v1/runs/{run_id}` | Same response schema |
| `GET /health` | `GET /api/v1/health` | Simpler health check |

#### Configuration Migration

**Old spectral_urbanism_boston config**:
```yaml
# configs/boston.yaml
city:
  name: boston
  grid_resolution_m: 100
  bbox: [-71.2, 42.3, -71.0, 42.4]
interventions:
  budget_k: 100
  types: [tree, cool_roof, shade]
experiments:
  monte_carlo_draws: 100
```

**New urban_heat_democratization approach**:
```
# Web UI: City selector dropdown
# → Boston [Research] [Classroom]
# → NYC, Chicago, LA, Houston (starters)
# → Upload custom boundary
# 
# Then: Scenario tab
# → Adjust budget, intervention mix
# → Compare visually
```

No CLI config needed; all accessible via web interface.

---

## For Developers & Researchers

### If You Were Contributing to spectral-urbanism

**Your research or code contributions are preserved and documented in:**
- Main wiki: [docs/wiki/03-science-and-interpretation.md](wiki/03-science-and-interpretation.md)
- Implementation notes: [docs/IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- Code: `core/` modules with equivalent or improved versions

**Next steps:**
1. Fork `urban_heat_democratization`
2. Review `core/` modules for methods you contributed
3. Submit PRs there if you have improvements
4. Reference the archived spectral-urbanism repo for historical context

---

### If You Were Contributing to spectral_urbanism_boston

**Your optimization and experiment code is preserved:**
- Research archive: `docs/RESEARCH_ARCHIVE/` (see git history for full implementation)
- Fairness audit patterns documented
- Plugin architecture preserved as explicit city config

**Next steps:**
1. If working on fairness audits: See `docs/RESEARCH_ARCHIVE/fairness_audit_framework.md`
2. If extending cities: Use web UI onboarding or config-based city profile
3. If developing new metrics: Contribute to `core/` modules in main repo
4. If running experiments: Use API + run tracking (simpler than Celery)

---

## Common Tasks & Solutions

### Task 1: I Have an Old spectral-urbanism Analysis

**Goal**: Reproduce the same analysis in urban_heat_democratization

**Steps**:
1. Open urban_heat_democratization web app
2. Select same city (City selector → Boston)
3. Upload same boundary if custom
4. Navigate to Explore → Layers
5. Toggle same overlay layers
6. Use Mitigation Lab if planning costs
7. Export results (PDF/DOCX/GeoJSON)

**Data preserved?**
- Boston boundary: ✅ Same
- Cheeger bottleneck: ✅ Exact same (precomputed)
- Resistance proxy: ✅ Exact same
- Cost catalog: ✅ Updated & expanded

---

### Task 2: I Have an Old spectral_urbanism_boston Config

**Goal**: Run the same pipeline in urban_heat_democratization

**Steps**:

1. **For Boston preset** (most common):
   ```bash
   # Old way
   spectral-urbanism run --config configs/boston.yaml
   
   # New way: Use web UI
   # Home → Explore Boston → Modify scenario → Export
   ```

2. **For custom city**:
   ```bash
   # Old way: Edit config file
   cp configs/city.template.yaml my_city.yaml
   # ... edit bbox, data_paths, features ...
   spectral-urbanism run --config my_city.yaml
   
   # New way: Use UI
   # Home → City Selector → Upload Boundary
   # Then Mitigation Lab to adjust intervention/budget
   ```

3. **For experiment/ablation**:
   ```bash
   # Old way: Run multiple configs, compare
   spectral-urbanism run-ablation --config configs/boston.yaml
   
   # New way: Use Comparison page
   # Explore → Comparison → Select cities/strategies → Download benchmark
   ```

---

### Task 3: I Need to Extract Fairness or Experiment Results

**Goal**: Recover fairness audit or experiment framework logic

**Solution**:
1. Check archived spectral_urbanism_boston repo (read-only)
2. Navigate to `spectral_urbanism/experiments/` directory
3. See files like `fairness.py`, `qa.py`
4. Git history preserved; can clone archived repo locally
5. Document needed patterns and open issue/PR in main repo

---

### Task 4: I Want to Add a New City

**Old spectral_urbanism_boston way**:
```yaml
# Edit configs/newcity.yaml
city:
  name: newcity
  bbox: [...]
  crs: "EPSG:4326"
data_paths:
  lst: "/path/to/lst.tif"
  ndvi: "/path/to/ndvi.tif"
```

**New urban_heat_democratization way**:
1. Web app → City Selector → Upload custom boundary (GeoJSON)
2. Provide boundary, optionally override map center/zoom
3. Use preconfigured rasters (demo) or upload custom
4. Run analysis immediately
5. No config file edits needed

**Benefit**: Onboarding new cities is now 100% visual; no coding required.

---

## Operational Transition

### For Deployment Teams

**Old spectral-urbanism**:
- Deployment: Docker only
- UI: Streamlit port 8501
- Status: Archived (not deployed)

**Old spectral_urbanism_boston**:
- Deployment: Docker Compose
- Dependencies: Redis, Celery
- Status: Archived (not deployed)

**New urban_heat_democratization**:
- Deployment: Vercel (production) + Docker (local)
- Dependencies: None (SQLite included)
- Status: **Live at [urban-heat.ai-aarti.com](https://urban-heat.ai-aarti.com)**

**Migration steps**:
1. ✅ Vercel deployment live and stable
2. ✅ Local development documented
3. ✅ All features tested
4. ✅ No external queues required
5. ✅ Archive legacy deployments

---

### For Data Teams

**Data structure changes**:

| Aspect | Old (spectral_urbanism_boston) | New (urban_heat_democratization) |
|--------|--------------------------------|----------------------------------|
| **City metadata** | `configs/city.yaml` | Web UI city selector |
| **Rasters** | Referenced in config | Uploaded via web or preconfigured |
| **Boundaries** | `data/` directory | Web upload or bundled (Boston) |
| **Results** | Filesystem outputs | JSON mirrors + SQLite runtime |
| **Artifacts** | TIFF, GeoJSON, PDF/DOCX | GeoJSON, PDF/DOCX, JSON export |

**Migration**:
1. Boston rasters already in `data/` (no action needed)
2. Custom rasters: Use web upload or add to `data/` with metadata
3. Results: Stored in `data/runtime/` with same schema
4. Artifacts: Export via API or web UI

---

## FAQ

### Q: Can I still run the old repositories?
**A**: Yes! They are archived but not deleted. All git history is preserved. You can still clone and run locally, but they will not receive updates.

### Q: Will my old links break?
**A**: 
- GitHub URLs will still work (redirects to archived view)
- Deployed instances: spectral-urbanism was not deployed; spectral_urbanism_boston was test-only
- API endpoints: Same structure; migrate POST requests to new host

### Q: How do I cite the old work?
**A**: 
- For methods: Cite via urban_heat_democratization (consolidated)
- For historical context: Reference the archived repos with full git hash
- Both are preserved in GitHub; use git refs like `aartisr/spectral-urbanism@54efd86`

### Q: Do I need to change my code?
**A**:
- If importing Python modules: No change needed during transition; both repos preserved
- If calling APIs: Update endpoint base URL only
- If using CLI: Migrate to web UI (simpler) or use preserved archive repo locally

### Q: Will the methods change?
**A**: No. All scientific methods are identical. The consolidation is structural only—same code, better integration.

---

## Support Resources

### Finding Help

| Question | Resource |
|----------|----------|
| "How do I use feature X?" | Web app → Help icons + wiki guide |
| "Where's the documentation?" | [urban-heat.ai-aarti.com/wiki](https://urban-heat.ai-aarti.com/wiki) |
| "How do I deploy?" | [docs/VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) |
| "What changed?" | This document + [docs/CONSOLIDATION_QUICK_REFERENCE.md](CONSOLIDATION_QUICK_REFERENCE.md) |
| "How do I report a bug?" | [GitHub Issues](https://github.com/aartisr/urban-heat-democratization/issues) |
| "How do I contribute?" | [docs/wiki/06-roadmap-governance-and-contribution.md](wiki/06-roadmap-governance-and-contribution.md) |

### Key Documentation
- **[README.md](../README.md)** — Project overview & quickstart
- **[docs/wiki/](wiki/)** — Full documentation (8 sections)
- **[docs/IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)** — Features & roadmap
- **[FEATURE_CONSOLIDATION_ANALYSIS.md](FEATURE_CONSOLIDATION_ANALYSIS.md)** — Detailed comparison

---

## Acknowledgments

The archived repositories (`spectral-urbanism` and `spectral_urbanism_boston`) represent important milestones in this research:

- **spectral-urbanism**: Pioneering interactive demo that proved the value of interactive spectral analysis
- **spectral_urbanism_boston**: Optimization and plug-and-play framework that informed the generalized pipeline

All scientific contributions are preserved and integrated. The archival represents a consolidation toward a single, unified production platform.

---

**Last Updated**: 2026-11-26  
**Author**: Consolidation Analysis Team  
**Status**: Ready for team review and archival approval
