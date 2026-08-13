import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link, useParams } from "@tanstack/react-router";

import { artifactDownloadUrl, getCity, getCityDataRegistration, getCityExperience, getCityLiveThermal, getCityMap, getCityReadiness, getCitySpectral, getCityTrustAudit, getRobustnessLab, listRuns, listScenarios, queueRun, registerCityData } from "../lib/api";
import { CityAtlasShell } from "../components/city-atlas-shell";
import { CityDetailSectionGrid } from "../components/city-detail-section-grid";
import { CityIntelligenceOverview } from "../components/city-intelligence-overview";
import { buildCityDetailViewConfig, buildRegistrationStatusCards } from "../lib/city-detail-config";

export function CityDetailPage() {
  const { cityId } = useParams({ from: "/cities/$cityId" });
  const queryClient = useQueryClient();
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [atlasActivated, setAtlasActivated] = useState(false);
  const [dataRegistration, setDataRegistration] = useState({
    thermalInputsRegistered: false,
    artifactBundleRegistered: false,
    bottleneckOverlayRegistered: false,
    coolingOverlayRegistered: false,
    thermalInputsPath: "",
    artifactBundlePath: "",
    bottleneckOverlayPath: "",
    coolingOverlayPath: "",
  });
  const cityQuery = useQuery({ queryKey: ["city", cityId], queryFn: () => getCity(cityId) });
  const cityExperienceQuery = useQuery({ queryKey: ["city-experience", cityId], queryFn: () => getCityExperience(cityId) });
  const cityLiveThermalQuery = useQuery({
    queryKey: ["city-live-thermal", cityId],
    queryFn: () => getCityLiveThermal(cityId),
    refetchInterval: (query) => {
      const payload = query.state.data;
      if (!payload?.autoRefreshEnabled) {
        return 30000;
      }
      const interval = payload.refreshIntervalSec ?? 900;
      return Math.max(30000, interval * 1000);
    },
  });
  const cityMapQuery = useQuery({
    queryKey: ["city-map", cityId],
    queryFn: () => getCityMap(cityId),
    enabled: atlasActivated,
    refetchInterval: (query) => {
      const payload = query.state.data;
      if (!payload?.liveThermalAdapter?.autoRefreshEnabled) {
        return false;
      }
      const interval = payload.liveThermalAdapter.refreshIntervalSec ?? 900;
      return Math.max(30000, interval * 1000);
    },
  });
  const cityReadinessQuery = useQuery({ queryKey: ["city-readiness", cityId], queryFn: () => getCityReadiness(cityId) });
  const cityTrustAuditQuery = useQuery({ queryKey: ["city-trust-audit", cityId], queryFn: () => getCityTrustAudit(cityId) });
  const cityDataRegistrationQuery = useQuery({
    queryKey: ["city-data-registration", cityId],
    queryFn: () => getCityDataRegistration(cityId),
    enabled: cityExperienceQuery.data ? !cityExperienceQuery.data.bundled : true,
  });
  const citySpectralQuery = useQuery({ queryKey: ["city-spectral", cityId], queryFn: () => getCitySpectral(cityId) });
  const robustnessQuery = useQuery({ queryKey: ["robustness-lab"], queryFn: getRobustnessLab });
  const runsQuery = useQuery({ queryKey: ["runs", cityId], queryFn: () => listRuns(cityId) });
  const scenariosQuery = useQuery({ queryKey: ["scenarios", cityId], queryFn: () => listScenarios(cityId) });
  const queueRunMutation = useMutation({
    mutationFn: () => queueRun(cityId, cityExperienceQuery.data?.defaultRunScenario ?? "Baseline heat atlas"),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["runs", cityId] });
      await queryClient.invalidateQueries({ queryKey: ["city-trust-audit", cityId] });
    },
  });
  const registerDataMutation = useMutation({
    mutationFn: () => registerCityData(cityId, dataRegistration),
    onSuccess: async () => {
      setRegistrationMessage("Saved local data registration for this city.");
      await queryClient.invalidateQueries({ queryKey: ["city", cityId] });
      await queryClient.invalidateQueries({ queryKey: ["city-readiness", cityId] });
      await queryClient.invalidateQueries({ queryKey: ["planner-validation", cityId] });
      await queryClient.invalidateQueries({ queryKey: ["city-data-registration", cityId] });
      await queryClient.invalidateQueries({ queryKey: ["city-trust-audit", cityId] });
    },
  });
  const cityMapStats = cityMapQuery.data ? {
    heatZones: cityMapQuery.data.heatZones.length,
    accessZones: cityMapQuery.data.accessZones.length,
    highHeatZones: cityMapQuery.data.heatZones.filter((zone) => zone.scoreClass.toLowerCase() === "high").length,
    highAccessZones: cityMapQuery.data.accessZones.filter((zone) => zone.scoreClass.toLowerCase() === "high").length,
  } : null;
  const cityName = cityQuery.data?.name ?? cityExperienceQuery.data?.cityName ?? cityId;
  const detailConfig = buildCityDetailViewConfig({
    cityId,
    cityName,
    cityProfile: cityQuery.data,
    cityExperience: cityExperienceQuery.data,
    cityMap: cityMapQuery.data,
    liveThermalAdapter: cityLiveThermalQuery.data,
    citySpectral: citySpectralQuery.data,
    cityReadiness: cityReadinessQuery.data,
    robustness: robustnessQuery.data,
    trustAudit: cityTrustAuditQuery.data,
    scenarios: scenariosQuery.data,
    runs: runsQuery.data,
    mapStats: cityMapStats,
  });
  const registrationStatusCards = buildRegistrationStatusCards(cityDataRegistrationQuery.data);

  useEffect(() => {
    if (!cityDataRegistrationQuery.data) {
      return;
    }
    setDataRegistration({
      thermalInputsRegistered: cityDataRegistrationQuery.data.thermalInputsRegistered,
      artifactBundleRegistered: cityDataRegistrationQuery.data.artifactBundleRegistered,
      bottleneckOverlayRegistered: cityDataRegistrationQuery.data.bottleneckOverlayRegistered,
      coolingOverlayRegistered: cityDataRegistrationQuery.data.coolingOverlayRegistered,
      thermalInputsPath: cityDataRegistrationQuery.data.thermalInputsPath ?? "",
      artifactBundlePath: cityDataRegistrationQuery.data.artifactBundlePath ?? "",
      bottleneckOverlayPath: cityDataRegistrationQuery.data.bottleneckOverlayPath ?? "",
      coolingOverlayPath: cityDataRegistrationQuery.data.coolingOverlayPath ?? "",
    });
  }, [cityDataRegistrationQuery.data]);

  return (
    <section className="page-stack city-detail-page">
      <CityIntelligenceOverview
        {...detailConfig.overview}
      />

      <CityAtlasShell
        cityName={cityName}
        data={cityMapQuery.data}
        scenarios={scenariosQuery.data}
        loading={cityMapQuery.isLoading}
        summary={cityMapQuery.data?.narrative ?? citySpectralQuery.data?.summary ?? "Open the atlas to inspect bottlenecks, cooling gaps, and study-layer evidence."}
        onActivate={() => setAtlasActivated(true)}
        onMapRefresh={() => {
          void cityMapQuery.refetch();
          void cityLiveThermalQuery.refetch();
          void cityTrustAuditQuery.refetch();
        }}
      />

      {cityMapQuery.data ? (
        <CityDetailSectionGrid
          title="Evidence and honesty"
          description="This page distinguishes what is observed, what is derived by the spectral workflow, and what is still simplified for planning use."
          cards={detailConfig.sections.evidenceCards}
        />
      ) : null}

      <CityDetailSectionGrid
        title="Snapshot and actions"
        cards={detailConfig.sections.snapshotCards.map((card, index) => (
          index === 1
            ? {
                ...card,
                children: (
                  <div className="quick-links">
                    <Link to="/scenarios" search={detailConfig.scenarioSearch} className="button-link">Build what-if</Link>
                    <Link to="/exports" className="button-link secondary">Export bundle</Link>
                    <Link to="/runs" className="button-link secondary">Inspect runs</Link>
                    <Link to="/cities" className="button-link secondary">Back to cities</Link>
                    <button
                      className="button-link secondary"
                      type="button"
                      onClick={() => queueRunMutation.mutate()}
                      disabled={queueRunMutation.isPending}
                    >
                      {queueRunMutation.isPending ? "Queuing..." : "Queue baseline run"}
                    </button>
                  </div>
                ),
              }
            : card
        ))}
      />

      <CityDetailSectionGrid
        title="Planning readiness"
        description={cityReadinessQuery.data?.narrative ?? "This panel checks whether the city is ready for bundled study, upload-first onboarding, or only partial scenario planning."}
        cards={detailConfig.sections.readinessCards}
      />

      {!cityExperienceQuery.data?.bundled ? (
        <article className="panel-card premium-section-card premium-city-data-card">
          <h2>Register local data readiness</h2>
          <p className="muted">
            Use this when an uploaded city has real local thermal inputs or derived overlays, so planner validation can reflect actual progress instead of only boundary presence.
          </p>
          <div className="panel-grid two-col">
            <label className="plan-card-mini premium-detail-card">
              <input
                type="checkbox"
                checked={dataRegistration.thermalInputsRegistered}
                onChange={(event) => setDataRegistration((prev) => ({ ...prev, thermalInputsRegistered: event.target.checked }))}
              />
              <strong>Thermal and land-cover inputs registered</strong>
              <input
                value={dataRegistration.thermalInputsPath}
                onChange={(event) => setDataRegistration((prev) => ({ ...prev, thermalInputsPath: event.target.value }))}
                placeholder="Optional path to thermal inputs"
              />
            </label>
            <label className="plan-card-mini premium-detail-card">
              <input
                type="checkbox"
                checked={dataRegistration.artifactBundleRegistered}
                onChange={(event) => setDataRegistration((prev) => ({ ...prev, artifactBundleRegistered: event.target.checked }))}
              />
              <strong>Local artifact bundle generated</strong>
              <input
                value={dataRegistration.artifactBundlePath}
                onChange={(event) => setDataRegistration((prev) => ({ ...prev, artifactBundlePath: event.target.value }))}
                placeholder="Optional path to local artifact bundle"
              />
            </label>
            <label className="plan-card-mini premium-detail-card">
              <input
                type="checkbox"
                checked={dataRegistration.bottleneckOverlayRegistered}
                onChange={(event) => setDataRegistration((prev) => ({ ...prev, bottleneckOverlayRegistered: event.target.checked }))}
              />
              <strong>Bottleneck overlay generated</strong>
              <input
                value={dataRegistration.bottleneckOverlayPath}
                onChange={(event) => setDataRegistration((prev) => ({ ...prev, bottleneckOverlayPath: event.target.value }))}
                placeholder="Optional path to bottleneck overlay"
              />
            </label>
            <label className="plan-card-mini premium-detail-card">
              <input
                type="checkbox"
                checked={dataRegistration.coolingOverlayRegistered}
                onChange={(event) => setDataRegistration((prev) => ({ ...prev, coolingOverlayRegistered: event.target.checked }))}
              />
              <strong>Cooling-access overlay generated</strong>
              <input
                value={dataRegistration.coolingOverlayPath}
                onChange={(event) => setDataRegistration((prev) => ({ ...prev, coolingOverlayPath: event.target.value }))}
                placeholder="Optional path to cooling-access overlay"
              />
            </label>
          </div>
          <div className="quick-links">
            <button
              className="button-link"
              type="button"
              onClick={() => registerDataMutation.mutate()}
              disabled={registerDataMutation.isPending}
            >
              {registerDataMutation.isPending ? "Saving..." : "Save data registration"}
            </button>
          </div>
          {registrationMessage ? <p className="muted">{registrationMessage}</p> : null}
          {registrationStatusCards.length ? (
            <CityDetailSectionGrid title="Registered local data status" cards={registrationStatusCards} />
          ) : null}
        </article>
      ) : null}

      {cityExperienceQuery.data?.studyCards.length ? (
        <CityDetailSectionGrid
          title={`${cityExperienceQuery.data.cityName} guided study workflow`}
          description={cityExperienceQuery.data.summary}
          cards={detailConfig.sections.workflowCards}
          actions={
            <>
              {cityExperienceQuery.data.studyGuideArtifactId ? (
                <a href={artifactDownloadUrl(cityExperienceQuery.data.studyGuideArtifactId)} className="button-link">Open study guide</a>
              ) : null}
              <Link to="/scenarios" search={detailConfig.scenarioSearch} className="button-link secondary">Open scenarios</Link>
              <Link to="/runs" className="button-link secondary">Open runs</Link>
            </>
          }
        />
      ) : null}

      <details className="panel-card premium-section-card">
        <summary className="premium-summary">Show planning robustness context</summary>
        <div className="premium-details-stack">
          <CityDetailSectionGrid
            title="Planning robustness context"
            description="These metrics still come from the repository's toy reliability lab, so they are a teaching and decision-framing aid rather than a city-specific resilience estimate."
            cards={detailConfig.sections.robustnessCards}
          />
        </div>
      </details>

      <details className="panel-card premium-section-card">
        <summary className="premium-summary">Show validation and reproducibility audit</summary>
        <div className="premium-details-stack">
          <CityDetailSectionGrid
            title="Validation and reproducibility audit"
            description="This trust layer shows the benchmark protocol, manifest, and provenance checks that keep the city story inspectable."
            cards={detailConfig.sections.trustCards}
          />
        </div>
      </details>
    </section>
  );
}
