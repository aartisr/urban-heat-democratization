import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";

import { PersonaFlowRail } from "../components/persona-flow-rail";
import { ScienceDemocratizationBanner } from "../components/science-democratization-banner";
import { StoryJourneyStrip } from "../components/story-journey-strip";
import { getCity, getCityExperience, getCityReadiness, getCityTrustAudit, listCities, listCityExperiences, onboardCity } from "../lib/api";
import { useActivePersonaMode } from "../lib/use-active-persona-mode";
import type { CityExperience, CityOnboardingInput, CityProfile } from "../lib/types";

const columnHelper = createColumnHelper<CityProfile>();

type BoundaryUploadPreview = {
  fileName: string | null;
  geometryType: string | null;
  featureCount: number | null;
  error: string | null;
};

const emptyUploadPreview: BoundaryUploadPreview = {
  fileName: null,
  geometryType: null,
  featureCount: null,
  error: null,
};

export function CitiesPage() {
  const { activeModeId } = useActivePersonaMode();
  const queryClient = useQueryClient();
  const citiesQuery = useQuery({ queryKey: ["cities"], queryFn: () => listCities() });
  const experiencesQuery = useQuery({ queryKey: ["city-experiences"], queryFn: listCityExperiences });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadPreview, setUploadPreview] = useState<BoundaryUploadPreview>(emptyUploadPreview);
  const catalogCities = (citiesQuery.data ?? []).filter((city) => city.id !== "custom");
  const bundledExperiences = (experiencesQuery.data ?? []).filter((experience: CityExperience) => experience.bundled);
  const bundledCityIds = new Set(bundledExperiences.map((experience) => experience.cityId));
  const uploadFirstCities = catalogCities.filter((city) => !bundledCityIds.has(city.id));

  const prefetchCityDetail = (cityId: string) => {
    void import("../routes/city-detail");
    void Promise.all([
      queryClient.prefetchQuery({ queryKey: ["city", cityId], queryFn: () => getCity(cityId), staleTime: 60_000 }),
      queryClient.prefetchQuery({ queryKey: ["city-experience", cityId], queryFn: () => getCityExperience(cityId), staleTime: 60_000 }),
      queryClient.prefetchQuery({ queryKey: ["city-readiness", cityId], queryFn: () => getCityReadiness(cityId), staleTime: 60_000 }),
      queryClient.prefetchQuery({ queryKey: ["city-trust-audit", cityId], queryFn: () => getCityTrustAudit(cityId), staleTime: 60_000 }),
    ]);
  };

  const columns = useMemo(() => [
    columnHelper.accessor("name", {
      header: "City",
      cell: (info) => (
        <Link
          to="/cities/$cityId"
          params={{ cityId: info.row.original.id }}
          onMouseEnter={() => prefetchCityDetail(info.row.original.id)}
          onFocus={() => prefetchCityDetail(info.row.original.id)}
        >
          {info.getValue()}
        </Link>
      ),
    }),
    columnHelper.accessor("region", { header: "Region" }),
    columnHelper.accessor("population", { header: "Population" }),
    columnHelper.accessor("status", { header: "Status" }),
    columnHelper.accessor("baselineTempC", { header: "Baseline °C", cell: (info) => `${info.getValue().toFixed(1)}°C` }),
    columnHelper.accessor("canopyCoverage", { header: "Canopy" }),
    columnHelper.accessor("planningCostMultiplier", { header: "Multiplier", cell: (info) => `${info.getValue().toFixed(2)}x` }),
  ], [queryClient]);

  const table = useReactTable({
    data: citiesQuery.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const [formValue, setFormValue] = useState<CityOnboardingInput>({
    name: "",
    region: "",
    population: "",
    boundarySource: "demo",
    boundaryPath: "",
    boundaryFileName: null,
    boundaryGeojsonText: null,
    notes: "",
  });
  const uploadReady = formValue.boundarySource !== "upload" || (Boolean(formValue.boundaryGeojsonText) && uploadPreview.error === null);

  return (
    <section className="page-stack">
      <header className="section-heading">
        <div>
          <div className="eyebrow">City onboarding</div>
          <h1>Pick a city, or bring in a new boundary with the same workflow.</h1>
        </div>
        <p>Bundled cities open immediately. Upload-first cities use the same modular path, so new work still feels guided instead of fragmented.</p>
      </header>

      <StoryJourneyStrip
        title="City onboarding story"
        subtitle="Whether a city is bundled or upload-first, the workflow remains a single intelligible journey from boundary to study-ready outputs."
        items={[
          { label: "Select", detail: "Choose a bundled city for instant analysis or an upload-first path for local onboarding." },
          { label: "Register", detail: "Attach valid boundaries and core metadata so downstream analysis is reproducible." },
          { label: "Validate", detail: "Use readiness checks to see what is fully backed versus still partial." },
          { label: "Advance", detail: "Carry the city into scenarios, exports, and runs with no context loss." },
        ]}
      />

      <PersonaFlowRail activeModeId={activeModeId} currentRoute="/cities" />

      <ScienceDemocratizationBanner />

      <section className="premium-story-grid">
        <article className="panel-card premium-card-stack">
          <h2>How to start</h2>
          <div className="info-list">
            <div>
              <strong>Open a bundled city</strong>
              <span>Start immediately with a complete atlas, overlays, export guides, and a clearer evidence story.</span>
            </div>
            <div>
              <strong>Add an upload-first city</strong>
              <span>Begin with a real boundary, then progressively register artifacts until the city becomes research-ready.</span>
            </div>
            <div>
              <strong>One modular system</strong>
              <span>The same interface supports flagship cities and new local onboarding without changing the mental model.</span>
            </div>
          </div>
        </article>
        <article className="panel-card premium-card-stack">
          <h2>What makes a city ready</h2>
          <ul className="bullet-list">
            <li>A clean municipal boundary.</li>
            <li>Clear study-area and thermal-source context.</li>
            <li>Derived spectral overlays such as bottlenecks and cooling gaps.</li>
            <li>Downloadable artifacts and provenance people can trust.</li>
          </ul>
        </article>
      </section>

      <article className="panel-card premium-section-card">
        <h2>Bundled today</h2>
        <div className="panel-grid two-col">
          {bundledExperiences.map((experience) => (
            <div key={experience.cityId} className="panel-card nested-card premium-city-card">
              <div className="eyebrow">Bundled study city</div>
              <h3>{experience.cityName}</h3>
              <p>{experience.summary}</p>
              <p className="muted">Bundled packages: {experience.availablePackageIds.length}</p>
              <div className="quick-links">
                <Link
                  to="/cities/$cityId"
                  params={{ cityId: experience.cityId }}
                  className="button-link"
                  onMouseEnter={() => prefetchCityDetail(experience.cityId)}
                  onFocus={() => prefetchCityDetail(experience.cityId)}
                >
                  Open {experience.cityName}
                </Link>
              </div>
            </div>
          ))}
          <div className="panel-card nested-card premium-city-card">
            <div className="eyebrow">Upload-first cities</div>
            <h3>{uploadFirstCities.map((city) => city.name).join(", ") || "Custom"}</h3>
            <p>
              These cities are available as presets, but they still depend on user-uploaded local boundaries before they can match the bundled experience.
            </p>
          </div>
        </div>
      </article>

      <div className="panel-grid two-col">
        <article className="panel-card premium-section-card">
          <h2>Onboard a city</h2>
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              if (formValue.boundarySource === "upload" && (!formValue.boundaryGeojsonText || uploadPreview.error)) {
                setErrorMessage(uploadPreview.error ?? "Choose a valid GeoJSON file before submitting.");
                return;
              }
              try {
                setErrorMessage(null);
                await onboardCity(formValue);
                await queryClient.invalidateQueries({ queryKey: ["cities"] });
                setFormValue({
                  name: "",
                  region: "",
                  population: "",
                  boundarySource: "demo",
                  boundaryPath: "",
                  boundaryFileName: null,
                  boundaryGeojsonText: null,
                  notes: "",
                });
                setUploadPreview(emptyUploadPreview);
              } catch (error) {
                setErrorMessage(error instanceof Error ? error.message : "Onboarding failed.");
              }
            }}
          >
            <label className="full-span">
              Catalog boundary preset
              <select
                defaultValue=""
                onChange={(e) => {
                  const presetId = e.target.value;
                  const presetCity = catalogCities.find((city) => city.id === presetId);
                  const presetExperience = bundledExperiences.find((experience) => experience.cityId === presetId);
                  if (presetCity && presetExperience) {
                    setFormValue({
                      name: presetCity.name,
                      region: presetCity.region,
                      population: presetCity.population,
                      boundarySource: "demo",
                      boundaryPath: "",
                      boundaryFileName: null,
                      boundaryGeojsonText: null,
                      notes: `${presetCity.name} is already bundled for immediate study in this workspace.`,
                    });
                    setUploadPreview(emptyUploadPreview);
                    return;
                  }
                  if (presetCity) {
                    setFormValue({
                      name: presetCity.name,
                      region: presetCity.region,
                      population: presetCity.population,
                      boundarySource: "upload",
                      boundaryPath: "",
                      boundaryFileName: null,
                      boundaryGeojsonText: null,
                      notes: `${presetCity.name} currently needs an uploaded boundary GeoJSON before analysis can begin.`,
                    });
                    setUploadPreview(emptyUploadPreview);
                    return;
                  }
                  setFormValue({
                    name: "",
                    region: "",
                    population: "",
                    boundarySource: "demo",
                    boundaryPath: "",
                    boundaryFileName: null,
                    boundaryGeojsonText: null,
                    notes: "",
                  });
                  setUploadPreview(emptyUploadPreview);
                }}
              >
                <option value="">Choose a bundled city</option>
                {catalogCities.map((city) => (
                  <option key={city.id} value={city.id}>
                    {bundledCityIds.has(city.id) ? `${city.name} (bundled now)` : `${city.name} (${city.id === "custom" ? "custom" : "needs upload"})`}
                  </option>
                ))}
              </select>
            </label>
            <label>
              City name
              <input value={formValue.name} onChange={(e) => setFormValue((prev) => ({ ...prev, name: e.target.value }))} />
            </label>
            <label>
              Region
              <input value={formValue.region} onChange={(e) => setFormValue((prev) => ({ ...prev, region: e.target.value }))} />
            </label>
            <label>
              Population
              <input value={formValue.population} onChange={(e) => setFormValue((prev) => ({ ...prev, population: e.target.value }))} />
            </label>
            <label>
              Boundary source
              <select
                value={formValue.boundarySource}
                onChange={(e) => setFormValue((prev) => ({ ...prev, boundarySource: e.target.value as CityOnboardingInput["boundarySource"] }))}
              >
                <option value="demo">Demo boundary</option>
                <option value="upload">Upload GeoJSON</option>
                <option value="catalog">Catalog service</option>
              </select>
            </label>
            {formValue.boundarySource === "upload" ? (
              <label className="full-span">
                Boundary GeoJSON file
                <input
                  type="file"
                  accept=".geojson,.json,application/geo+json,application/json"
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      setUploadPreview(emptyUploadPreview);
                      setFormValue((prev) => ({
                        ...prev,
                        boundaryFileName: null,
                        boundaryGeojsonText: null,
                      }));
                      return;
                    }
                    let parsed: unknown;
                    const boundaryGeojsonText = await file.text();
                    try {
                      parsed = JSON.parse(boundaryGeojsonText) as unknown;
                    } catch {
                      setUploadPreview({
                        fileName: file.name,
                        geometryType: null,
                        featureCount: null,
                        error: "That file is not valid JSON, so it cannot be used as GeoJSON.",
                      });
                      setFormValue((prev) => ({
                        ...prev,
                        boundaryFileName: file.name,
                        boundaryGeojsonText: null,
                        boundaryPath: "",
                      }));
                      return;
                    }
                    if (!parsed || typeof parsed !== "object") {
                      setUploadPreview({
                        fileName: file.name,
                        geometryType: null,
                        featureCount: null,
                        error: "That file does not look like a GeoJSON object.",
                      });
                      setFormValue((prev) => ({
                        ...prev,
                        boundaryFileName: file.name,
                        boundaryGeojsonText: null,
                        boundaryPath: "",
                      }));
                      return;
                    }
                    const payload = parsed as { type?: unknown; features?: unknown; geometry?: { type?: unknown } };
                    if (payload.type === "FeatureCollection") {
                      const features = Array.isArray(payload.features)
                        ? payload.features.filter((feature) => typeof feature === "object" && feature !== null)
                        : [];
                      setUploadPreview({
                        fileName: file.name,
                        geometryType: "FeatureCollection",
                        featureCount: features.length,
                        error: features.length > 0 ? null : "FeatureCollection files need at least one feature.",
                      });
                      setFormValue((prev) => ({
                        ...prev,
                        boundaryFileName: file.name,
                        boundaryGeojsonText: features.length > 0 ? boundaryGeojsonText : null,
                        boundaryPath: "",
                      }));
                      return;
                    }
                    if (payload.type === "Feature") {
                      const geometryType = typeof payload.geometry?.type === "string" ? payload.geometry.type : "Feature";
                      setUploadPreview({
                        fileName: file.name,
                        geometryType,
                        featureCount: 1,
                        error: null,
                      });
                      setFormValue((prev) => ({
                        ...prev,
                        boundaryFileName: file.name,
                        boundaryGeojsonText,
                        boundaryPath: "",
                      }));
                      return;
                    }
                    setUploadPreview({
                      fileName: file.name,
                      geometryType: null,
                      featureCount: null,
                      error: "GeoJSON must be a Feature or FeatureCollection.",
                    });
                    setFormValue((prev) => ({
                      ...prev,
                      boundaryFileName: file.name,
                      boundaryGeojsonText: null,
                      boundaryPath: "",
                    }));
                  }}
                />
                <span className="muted">
                  {formValue.boundaryFileName ? `Selected file: ${formValue.boundaryFileName}` : "Choose a real GeoJSON boundary file from your computer."}
                </span>
                {uploadPreview.fileName ? (
                  <span className="muted">
                    {uploadPreview.error
                      ? uploadPreview.error
                      : `Validated ${uploadPreview.geometryType} with ${uploadPreview.featureCount} feature${uploadPreview.featureCount === 1 ? "" : "s"}.`}
                  </span>
                ) : null}
              </label>
            ) : null}
            {formValue.boundarySource === "catalog" ? (
              <p className="full-span muted">
                The Boston catalog preset loads the bundled repository boundary automatically.
              </p>
            ) : null}
            <label className="full-span">
              Notes
              <textarea value={formValue.notes} onChange={(e) => setFormValue((prev) => ({ ...prev, notes: e.target.value }))} rows={4} />
            </label>
            <p className="full-span muted">
              Boston can load directly from the bundled catalog. New York City, Chicago, Los Angeles, Houston, and custom cities use the same upload-first onboarding workflow.
            </p>
            <div className="full-span">
              <button className="button-link" type="submit" disabled={!uploadReady}>Save city</button>
            </div>
            {errorMessage ? <p className="full-span full-span-error">{errorMessage}</p> : null}
          </form>
        </article>

      <article className="panel-card premium-section-card">
        <h2>City catalog</h2>
        <div className="table-shell">
            <table>
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th key={header.id}>{header.isPlaceholder ? null : header.column.columnDef.header as string}</th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>{cell.renderValue() as React.ReactNode}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </section>
  );
}
