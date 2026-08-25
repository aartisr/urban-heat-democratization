import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { WorkflowHeader } from "../components/workflow-header";
import { artifactDownloadUrl, getCityDataRegistration, getCityReadiness, listArtifacts, listBundledPackages, listCities, listCostSources, validateBundledPackage } from "../lib/api";
import type { ArtifactRecord, BundledPackage, CityProfile } from "../lib/types";

function ArtifactMiniPreview({ artifact }: { artifact: ArtifactRecord }) {
  if (artifact.kind !== "geojson") {
    return null;
  }

  const tone = artifact.id === "cheeger-bottleneck"
    ? { fill: "rgba(185, 28, 28, 0.28)", stroke: "#b91c1c" }
    : artifact.id === "low-cooling-access"
      ? { fill: "rgba(14, 165, 233, 0.28)", stroke: "#0ea5e9" }
      : { fill: "rgba(15, 118, 110, 0.18)", stroke: "#0f766e" };

  return (
    <div className="artifact-preview">
      <svg viewBox="0 0 120 80" role="img" aria-label={`${artifact.name} preview`}>
        <rect x="0" y="0" width="120" height="80" rx="12" fill="#eff6ff" />
        <path d="M18 18 L95 12 L106 56 L73 69 L20 58 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
        {artifact.previewGeometry.length > 0 ? (
          artifact.previewGeometry.map((polygon, index) => (
            <polygon
              key={`${artifact.id}-${index}`}
              points={polygon.map((point) => `${(point.x / 100) * 90 + 15},${(point.y / 100) * 55 + 12}`).join(" ")}
              fill={tone.fill}
              stroke={tone.stroke}
              strokeWidth="1.8"
              opacity={index === 0 ? 0.95 : 0.72}
            />
          ))
        ) : (
          <>
            <path d="M30 28 L71 23 L82 42 L51 54 L26 45 Z" fill={tone.fill} stroke={tone.stroke} strokeWidth="2" />
            <path d="M62 30 L92 27 L97 49 L76 56 L58 46 Z" fill={tone.fill} stroke={tone.stroke} strokeWidth="2" opacity="0.85" />
          </>
        )}
      </svg>
    </div>
  );
}

export function ExportsPage() {
  const artifactsQuery = useQuery({ queryKey: ["artifacts"], queryFn: listArtifacts });
  const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: listCities });
  const bundledPackagesQuery = useQuery({ queryKey: ["bundled-packages"], queryFn: listBundledPackages });
  const bundledPackages = bundledPackagesQuery.data ?? [];
  const [selectedPackageId, setSelectedPackageId] = useState<string>("");
  useEffect(() => {
    if (!selectedPackageId && bundledPackages.length > 0) {
      setSelectedPackageId(bundledPackages[0].id);
    }
  }, [selectedPackageId, bundledPackages]);
  const selectedPackage = bundledPackages.find((pkg) => pkg.id === selectedPackageId) ?? bundledPackages[0];
  const readinessQuery = useQuery({
    queryKey: ["city-readiness", selectedPackage?.city_id],
    queryFn: () => getCityReadiness(selectedPackage?.city_id ?? "custom"),
    enabled: Boolean(selectedPackage?.city_id),
  });
  const packageValidationQuery = useQuery({
    queryKey: ["bundled-package-validation", selectedPackage?.id],
    queryFn: () => validateBundledPackage(selectedPackage?.id ?? ""),
    enabled: Boolean(selectedPackage?.id),
  });
  const costSourcesQuery = useQuery({ queryKey: ["cost-sources"], queryFn: listCostSources });
  const [selectedUploadCity, setSelectedUploadCity] = useState<string>("");
  const bundledCityIds = new Set(bundledPackages.map((pkg: BundledPackage) => pkg.city_id));
  const uploadCities = (citiesQuery.data ?? []).filter((city: CityProfile) => !bundledCityIds.has(city.id) && city.id !== "custom");
  useEffect(() => {
    if (!selectedUploadCity && uploadCities.length > 0) {
      setSelectedUploadCity(uploadCities[0].id);
    }
  }, [selectedUploadCity, uploadCities]);
  const uploadRegistrationQuery = useQuery({
    queryKey: ["city-data-registration", selectedUploadCity],
    queryFn: () => getCityDataRegistration(selectedUploadCity),
    enabled: selectedUploadCity.length > 0,
  });
  const curatedBundle = (artifactsQuery.data ?? []).filter((artifact) => (
    selectedPackage?.artifactIds.includes(artifact.id) ?? false
  ));

  return (
    <section className="page-stack exports-page">
      <WorkflowHeader
        wide
        eyebrow="Exports"
        title="Download the package, the evidence, and the living record."
        description="This page surfaces real artifacts from the repo and makes them downloadable from the app without making users hunt across the codebase."
      />

      <article className="panel-card premium-section-card">
        <h2>{selectedPackage?.name ?? "Bundled package"} export bundle</h2>
        <p className="muted">
          {selectedPackage?.summary ?? "This is the recommended download sequence for the selected bundled package."}
        </p>
        {bundledPackages.length > 0 ? (
          <div className="quick-links">
            <label className="plan-card-mini">
              <strong>Package</strong>
              <select value={selectedPackageId} onChange={(event) => setSelectedPackageId(event.target.value)}>
                {bundledPackages.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name}</option>)}
              </select>
            </label>
          </div>
        ) : null}
        <div className="panel-grid two-col">
          {curatedBundle.map((artifact) => (
            <div key={artifact.id} className="panel-card nested-card premium-artifact-card">
              <div className="eyebrow">Bundled artifact</div>
              <h3>{artifact.name}</h3>
              <ArtifactMiniPreview artifact={artifact} />
              <p>{artifact.description}</p>
              <p className="muted">{artifact.preview}</p>
              <a className="button-link secondary" href={artifactDownloadUrl(artifact.id)}>
                Download
              </a>
            </div>
          ))}
        </div>
      </article>

      <div className="panel-grid two-col premium-story-grid">
        <article className="panel-card premium-section-card">
          <h2>Why this bundle matters</h2>
          <p className="muted">
            {selectedPackage?.summary ?? readinessQuery.data?.narrative ?? "Package readiness is loading."}
          </p>
          <div className="metric-list">
            <div><span>Bundled status</span><strong>{readinessQuery.data?.readinessLabel ?? "Loading"}</strong></div>
            <div><span>Artifacts available</span><strong>{curatedBundle.length}</strong></div>
            <div><span>Cost references loaded</span><strong>{costSourcesQuery.data?.length ?? 0}</strong></div>
          </div>
        </article>
        <article className="panel-card premium-section-card">
          <h2>Package contract</h2>
          {packageValidationQuery.data ? (
            <>
              <p className="muted">
                {packageValidationQuery.data.valid
                  ? "This bundled package passes the current contract checks."
                  : "This bundled package is registered, but it still has contract issues to resolve."}
              </p>
              <ul className="bullet-list">
                {packageValidationQuery.data.checks.map((check) => (
                  <li key={check.id}>{check.label}: {check.status} - {check.detail}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted">Loading package validation...</p>
          )}
        </article>
      </div>

      <article className="panel-card premium-section-card">
        <h2>How to use the exports</h2>
        <ul className="bullet-list">
          <li>Start with the study guide when one is available for plain-language interpretation.</li>
          <li>Use the boundary and overlay files when you need the actual bundled geometry.</li>
          <li>Use the living implementation log to see what is real, partial, or still missing.</li>
          <li>Use the cost sources as evidence anchors, not as a full procurement table.</li>
        </ul>
      </article>

      <article className="panel-card premium-section-card">
        <h2>Uploaded city artifact area</h2>
        <p className="muted">
          Upload-first cities can expose their registered local inputs and exported artifacts here, giving them a visible path toward bundled-city study readiness.
        </p>
        {uploadCities.length > 0 ? (
          <>
            <div className="quick-links">
              <label className="plan-card-mini">
                <strong>Uploaded city</strong>
                <select value={selectedUploadCity} onChange={(event) => setSelectedUploadCity(event.target.value)}>
                  {uploadCities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </label>
            </div>
            {uploadRegistrationQuery.data ? (
              <div className="panel-grid two-col">
                {[
                  { label: "Thermal inputs", path: uploadRegistrationQuery.data.thermalInputsPath, exists: uploadRegistrationQuery.data.verifiedPaths.thermalInputsPath, valid: uploadRegistrationQuery.data.contentValid.thermalInputsPath, note: uploadRegistrationQuery.data.contentLabels.thermalInputsPath },
                  { label: "Artifact bundle", path: uploadRegistrationQuery.data.artifactBundlePath, exists: uploadRegistrationQuery.data.verifiedPaths.artifactBundlePath, valid: uploadRegistrationQuery.data.contentValid.artifactBundlePath, note: uploadRegistrationQuery.data.contentLabels.artifactBundlePath },
                  { label: "Bottleneck overlay", path: uploadRegistrationQuery.data.bottleneckOverlayPath, exists: uploadRegistrationQuery.data.verifiedPaths.bottleneckOverlayPath, valid: uploadRegistrationQuery.data.contentValid.bottleneckOverlayPath, note: uploadRegistrationQuery.data.contentLabels.bottleneckOverlayPath },
                  { label: "Cooling overlay", path: uploadRegistrationQuery.data.coolingOverlayPath, exists: uploadRegistrationQuery.data.verifiedPaths.coolingOverlayPath, valid: uploadRegistrationQuery.data.contentValid.coolingOverlayPath, note: uploadRegistrationQuery.data.contentLabels.coolingOverlayPath },
                ].map((item) => (
                  <div key={item.label} className="panel-card nested-card premium-artifact-card">
                    <div className="eyebrow">{item.valid ? "validated" : item.exists ? "exists only" : "missing"}</div>
                    <h3>{item.label}</h3>
                    <p className="muted">{item.path ?? "No path registered."}</p>
                    <p>{item.note}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">Loading uploaded-city artifact registration...</p>
            )}
          </>
        ) : (
          <p className="muted">No uploaded cities are available yet.</p>
        )}
      </article>

      <article className="panel-card premium-section-card">
        <h2>Available artifacts</h2>
        <div className="panel-grid two-col">
          {(artifactsQuery.data ?? []).map((artifact) => (
            <div key={artifact.id} className="panel-card nested-card premium-artifact-card">
              <div className="eyebrow">{artifact.kind}</div>
              <h3>{artifact.name}</h3>
              <ArtifactMiniPreview artifact={artifact} />
              <p>{artifact.description}</p>
              <p className="muted">{artifact.preview}</p>
              <a className="button-link secondary" href={artifactDownloadUrl(artifact.id)}>
                Download
              </a>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
