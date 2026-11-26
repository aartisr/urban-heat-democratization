# Repository Consolidation Quick Reference

**TL;DR**: `urban_heat_democratization` is the production platform that includes all features from `spectral-urbanism` and `spectral_urbanism_boston`. Both legacy repos are safe to archive.

---

## At a Glance

| Repository | Status | Action |
|------------|--------|--------|
| **urban_heat_democratization** | 🟢 Active Production | Keep & maintain |
| **spectral-urbanism** | 🟡 Legacy Demo | Archive |
| **spectral_urbanism_boston** | 🟡 Legacy Pipeline | Archive |

---

## Feature Checklist: "Is [Feature] in urban_heat_democratization?"

### Scientific Methods ✅
- [x] Graph & spectral analysis
- [x] Cheeger bottleneck
- [x] Cooling access metrics
- [x] Reliability & robustness
- [x] Percolation analysis
- [x] Raster processing
- [x] Thermal network modeling

### User Features ✅
- [x] Interactive web app
- [x] City atlas & browsing
- [x] Scenario planning
- [x] Mitigation Lab (browser-based)
- [x] Robustness teaching lab
- [x] Export (PDF, DOCX, GeoJSON)
- [x] Run history & tracking

### Data & Cities ✅
- [x] Boston (research & classroom)
- [x] NYC, Chicago, LA, Houston (starters)
- [x] Custom city upload
- [x] Boundary support
- [x] Live thermal adapters

### Operations ✅
- [x] FastAPI backend
- [x] SQLite persistence
- [x] Docker deployment
- [x] Vercel serverless
- [x] Local development
- [x] CI/CD pipeline
- [x] Health checks

### Documentation ✅
- [x] 8-section wiki
- [x] Implementation status
- [x] Technical reference
- [x] Screen tour guide
- [x] Deployment guides
- [x] GitHub Pages

### Testing & QA ✅
- [x] Unit tests
- [x] Integration tests
- [x] Browser tests
- [x] Accessibility audit
- [x] Package validation

---

## Migration Guide

### Coming from spectral-urbanism?
Use this mapping:

| Old Feature | New Location |
|------------|--------------|
| Home.py Streamlit | `urban-heat-democratization` web app → Home tab |
| Data page | Atlas → Layers, then Explore → Data |
| Results page | Explore → Results/Analysis |
| Theory page | Wiki → Science & Interpretation |
| Mitigation costs | Explore → Mitigation Lab |
| PDF export | Export tab (top nav) |
| City profiles | Wiki → Cities reference |

### Coming from spectral_urbanism_boston?
Use this mapping:

| Old Feature | New Location |
|------------|--------------|
| `configs/city.yaml` | Web app: City selector + onboarding |
| Run pipeline | API: POST `/api/v1/runs` |
| Experiment framework | Runs page (tracks all executions) |
| Fairness audit | Research archive (preserved in git) |
| Feature plugins | City config (simpler model) |
| Benchmarks | Comparison page (charted view) |

---

## Why Archive?

**spectral-urbanism**:
- Streamlit UI replaced by modern React web app
- All scientific methods consolidated
- Last update: June 2026 (5 commits total)
- No user-facing features that aren't in urban_heat_democratization

**spectral_urbanism_boston**:
- Experiment framework integrated into run tracking
- All city support merged into main app
- Last update: May 2026 (4 commits total)
- Research infrastructure preserved in git history

---

## Before Archival Checklist

- [ ] Add acknowledgment/credit to main README
- [ ] Create migration guide (this document)
- [ ] Export fairness audit framework to research archive
- [ ] Tag final commits in both repos
- [ ] Update any external links/documentation
- [ ] Notify team/collaborators
- [ ] Verify urban_heat_democratization is fully functional
- [ ] Archive via GitHub (Settings → Danger Zone)
- [ ] Leave README pointer in archived repos

---

## Safety Verification

**urban_heat_democratization has**:
- 87 git commits (vs. 5 and 4 in legacy repos)
- Active development & maintenance
- Production deployment (Vercel)
- Full test suite
- Comprehensive documentation
- All consolidated features working

**Risk assessment**: ✅ **LOW RISK** to archive legacy repos

---

## Support & Questions

For questions about the consolidation:
1. Check [FEATURE_CONSOLIDATION_ANALYSIS.md](FEATURE_CONSOLIDATION_ANALYSIS.md) for detailed comparison
2. See [README.md](../README.md) for current project status
3. Review [wiki/06-roadmap-governance-and-contribution.md](wiki/06-roadmap-governance-and-contribution.md) for contribution guidelines

---

**Last Updated**: 2026-11-26  
**Recommendation**: Archive legacy repos after team review
