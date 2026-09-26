import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const screenshotsDir = path.resolve(currentDir, "../../../docs/screenshots");

async function ensureScreenshotsDir() {
  await fs.mkdir(screenshotsDir, { recursive: true });
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: "u-admin",
        displayName: "Demo Admin",
        authEnforced: false,
        activeWorkspaceId: "default",
        memberships: [
          { id: "default", role: "admin" },
          { id: "boston-lab", role: "editor" },
        ],
      }),
    });
  });

  await page.route("**/api/v1/workspaces", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        { id: "default", role: "admin" },
        { id: "boston-lab", role: "editor" },
      ]),
    });
  });

  await page.route("**/api/v1/cities", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        cities: [
          {
            id: "boston",
            name: "Boston",
            region: "Northeast US",
            population: "675k",
            status: "Ready",
            baselineTempC: 33.8,
            canopyCoverage: "27%",
            planningCostMultiplier: 1,
            description: "Bundled demo city",
          },
        ],
      }),
    });
  });

  await page.route("**/api/v1/city-experiences", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          cityId: "boston",
          cityName: "Boston",
          bundled: true,
          summary: "Bundled Boston",
          readinessLabel: "Ready",
          defaultRunScenario: "Baseline heat atlas",
          defaultPackageId: "boston-research",
          studyGuideArtifactId: null,
          exportArtifactIds: [],
          runSeedArtifactIds: [],
          starterScenarios: [],
          studyCards: [],
          spectralAvailable: true,
          availablePackageIds: ["boston-research"],
        },
      ]),
    });
  });

  await page.route("**/api/v1/cities/**/experience", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        cityId: "boston",
        cityName: "Boston",
        bundled: true,
        summary: "Bundled Boston",
        readinessLabel: "Ready",
        defaultRunScenario: "Baseline heat atlas",
        defaultPackageId: "boston-research",
        studyGuideArtifactId: null,
        exportArtifactIds: [],
        runSeedArtifactIds: [],
        starterScenarios: [],
        studyCards: [],
        spectralAvailable: true,
        availablePackageIds: ["boston-research"],
      }),
    });
  });

  await page.route("**/api/v1/runs**", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "run-boston-001",
          cityId: "boston",
          scenario: "Baseline heat atlas",
          status: "queued",
          progress: 0,
          updatedAt: new Date().toISOString(),
          outputs: ["boston-analysis-summary.json"],
          summary: "Queued",
          outputArtifactIds: [],
          logs: [],
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/v1/scenarios**", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "scenario-boston-001",
          label: "Boston mock scenario",
          cityId: "boston",
          planningMode: "best_under_budget",
          budgetUsd: 250000,
          estimatedCostUsd: 250000,
          heatReductionC: 1.2,
          equityScore: 78,
          confidence: 0.68,
          summary: "Mock scenario for gallery capture",
          recommendedActions: [],
          allocationSummary: {
            totalAllocatedBudgetUsd: 250000,
            unallocatedBudgetUsd: 0,
            allocationCoveragePct: 100,
            allocationMethod: "mock",
          },
          evidenceSummary: {
            verifiedUnitCostCount: 1,
            rankingOnlyCount: 0,
            benchmarkOnlyCount: 0,
            readinessLabel: "partial",
            explanation: "Mock",
          },
          benchmarkSummary: {
            wholeCityBenchmarkUsd: 1000000,
            budgetGapUsd: 750000,
            budgetCoveragePct: 25,
            benchmarkLabel: "Mock",
            explanation: "Mock",
          },
          exhaustiveEstimateSummary: {
            available: true,
            estimatedCostUsd: 1200000,
            fundedCostUsd: 250000,
            remainingGapUsd: 950000,
            coveragePct: 20.8,
            costableActions: 4,
            methodology: "Mock",
          },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: "scenario-boston-001",
          label: "Boston mock scenario",
          cityId: "boston",
          planningMode: "best_under_budget",
          budgetUsd: 250000,
          estimatedCostUsd: 250000,
          heatReductionC: 1.2,
          equityScore: 78,
          confidence: 0.68,
          summary: "Mock scenario for gallery capture",
          recommendedActions: [],
          allocationSummary: {
            totalAllocatedBudgetUsd: 250000,
            unallocatedBudgetUsd: 0,
            allocationCoveragePct: 1,
            allocationMethod: "mock",
          },
          evidenceSummary: {
            verifiedUnitCostCount: 1,
            rankingOnlyCount: 0,
            benchmarkOnlyCount: 0,
            readinessLabel: "ready",
            explanation: "Mock",
          },
          benchmarkSummary: {
            wholeCityBenchmarkUsd: 1000000,
            budgetGapUsd: 750000,
            budgetCoveragePct: 25,
            benchmarkLabel: "Mock",
            explanation: "Mock",
          },
          exhaustiveEstimateSummary: {
            available: true,
            estimatedCostUsd: 1200000,
            fundedCostUsd: 250000,
            remainingGapUsd: 950000,
            coveragePct: 20.8,
            costableActions: 4,
            methodology: "Mock",
          },
        },
      ]),
    });
  });

  await page.route("**/api/v1/cost-sources", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/v1/interventions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/v1/robustness/lab", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        title: "lab",
        summary: "lab",
        pValues: [],
        baselinePercolation: [],
        interventionPercolation: [],
        lambda2Baseline: 0,
        lambda2Intervention: 0,
        phiBaseline: 0,
        phiIntervention: 0,
        reliabilityBaseline: 0,
        reliabilityIntervention: 0,
        notes: [],
      }),
    });
  });

  await page.route("**/api/v1/cities/**", async (route) => {
    const url = route.request().url();
    if (/\/api\/v1\/cities\/[^/]+$/.test(url)) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "boston",
          name: "Boston",
          region: "Northeast US",
          population: "675k",
          status: "Ready",
          baselineTempC: 33.8,
          canopyCoverage: "27%",
          planningCostMultiplier: 1,
          description: "Bundled demo city",
        }),
      });
      return;
    }
    if (url.includes("/map")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          viewBox: { width: 1000, height: 700 },
          bounds: { minLng: -71.3, minLat: 42.2, maxLng: -70.9, maxLat: 42.45 },
          boundary: [],
          heatZones: [
            {
              id: "priority-a",
              label: "Priority area A",
              score: 92,
              scoreClass: "high",
              points: [{ x: -71.2, y: 42.25 }, { x: -71.08, y: 42.25 }, { x: -71.08, y: 42.36 }, { x: -71.2, y: 42.36 }],
            },
            {
              id: "priority-b",
              label: "Priority area B",
              score: 54,
              scoreClass: "moderate",
              points: [{ x: -71.07, y: 42.28 }, { x: -70.96, y: 42.28 }, { x: -70.96, y: 42.39 }, { x: -71.07, y: 42.39 }],
            },
          ],
          accessZones: [],
          legend: [],
          highlights: [],
          artifactPaths: [],
          thermalSources: [],
          liveThermalAdapter: {
            status: "planned",
            headline: "planned",
            detail: "planned",
            providerTargets: [],
            activeSourceCount: 0,
            autoRefreshEnabled: false,
            autoRefreshAvailable: false,
            usingBackupData: false,
            backupAvailable: false,
          },
          truthMode: {
            headline: "h",
            interpretationStatus: "estimated",
            methodology: "m",
            caution: "c",
            notes: [],
          },
          layerProvenance: [],
          narrative: "n",
        }),
      });
      return;
    }
    if (url.includes("/live-thermal")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "planned",
          headline: "planned",
          detail: "planned",
          providerTargets: [],
          activeSourceCount: 0,
          autoRefreshEnabled: false,
          autoRefreshAvailable: false,
          usingBackupData: false,
          backupAvailable: false,
        }),
      });
      return;
    }
    if (url.includes("/readiness")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          bundled: true,
          readinessLabel: "Ready",
          narrative: "Ready",
          checks: [],
        }),
      });
      return;
    }
    if (url.includes("/benchmarks")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          headline: "Benchmark snapshot",
          cases: [],
        }),
      });
      return;
    }
    if (url.includes("/planner-validation")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          valid: true,
          errors: [],
          warnings: [],
          checks: [],
        }),
      });
      return;
    }
    if (url.includes("/spectral")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          summary: "Spectral data available",
          cheegerFeatureCount: 4,
          coolingZoneCount: 3,
          cheegerHighlights: [],
          coolingHighlights: [],
          artifactPaths: [],
        }),
      });
      return;
    }
    if (url.includes("/trust-audit")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          cityName: "Boston",
          generatedAt: new Date().toISOString(),
          summary: "ok",
          benchmarkProtocol: [],
          reproducibilityManifest: [],
          provenanceAudit: [],
          notes: [],
        }),
      });
      return;
    }
    if (url.includes("/data-registration")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cityId: "boston",
          thermalInputsRegistered: true,
          artifactBundleRegistered: true,
          bottleneckOverlayRegistered: true,
          coolingOverlayRegistered: true,
          thermalInputsPath: null,
          artifactBundlePath: null,
          bottleneckOverlayPath: null,
          coolingOverlayPath: null,
          verifiedPaths: {},
          contentValid: {},
          contentLabels: {},
        }),
      });
      return;
    }
    await route.continue();
  });
});

test("capture documentation screenshots", async ({ page }) => {
  await ensureScreenshotsDir();
  const captureSettledPage = async (fileName: string) => {
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(screenshotsDir, fileName), fullPage: true });
  };

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Make heat visible. Make action possible." })).toBeVisible();
  await captureSettledPage("home.png");

  await page.getByRole("link", { name: "Explore Boston" }).click();
  await expect(page).toHaveURL(/\/cities\/boston$/);
  await page.locator('a[href="/cities"]').first().click();
  await expect(page).toHaveURL(/\/cities$/);
  await captureSettledPage("cities.png");

  await page.getByRole("link", { name: "Open Boston" }).click();
  await expect(page).toHaveURL(/\/cities\/boston$/);
  await expect(page.getByText("Planning readiness and data requirements")).toBeVisible();
  await captureSettledPage("city-detail.png");

  await page.goto("/cities/boston?view=explore");
  const showAtlas = page.getByRole("button", { name: "Show the city atlas" });
  if (await showAtlas.isVisible()) {
    await showAtlas.click();
  }
  await expect(page.getByRole("group", { name: "Atlas views" })).toBeVisible();
  await expect(page.locator(".maplibre-stage")).toBeVisible();
  await captureSettledPage("city-atlas.png");

  await page.goto("/scenarios");
  await expect(page.getByRole("heading", { name: "See what this budget can fund." })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Compare a cooling investment" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "What this budget is allowed to fund" })).toBeVisible();
  await captureSettledPage("scenarios.png");
  await page.getByRole("button", { name: "$10k", exact: true }).click();
  await expect(page.getByText("No exact $10,000 scenario is loaded.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate $10,000 scenario" })).toBeVisible();
  await page.getByRole("button", { name: "Difference", exact: true }).click();
  await expect(page.getByRole("region", { name: "After scenario required for $10,000" })).toBeVisible();
  await page.getByRole("button", { name: "$250k", exact: true }).click();
  await expect(page.getByRole("region", { name: "Difference · modeled priority reduction" })).toBeVisible();
  await page.getByRole("button", { name: /Priority area A/ }).first().click();
  await expect(page.getByText(/Baseline priority 92\.0 → modeled priority/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Priority area A" })).toBeVisible();
  await expect(page.getByText(/Assumption:.*planning-priority transformation/)).toBeVisible();

  await page.getByRole("button", { name: "Before / scenario", exact: true }).click();
  const mapsAtDesktop = page.locator(".scenario-comparison-maps .scenario-comparison-map svg");
  await expect(mapsAtDesktop).toHaveCount(2);
  const initialViewBox = await mapsAtDesktop.nth(0).getAttribute("viewBox");
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(mapsAtDesktop.nth(0)).not.toHaveAttribute("viewBox", initialViewBox ?? "");
  await expect(mapsAtDesktop.nth(1)).toHaveAttribute("viewBox", await mapsAtDesktop.nth(0).getAttribute("viewBox") ?? "");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("tablist", { name: "Mobile comparison view" })).toBeVisible();
  await page.getByRole("tab", { name: "Scenario", exact: true }).click();
  await expect(page.getByRole("region", { name: /After · Modeled priority after scenario/ })).toBeVisible();
  await page.getByRole("tab", { name: "Difference", exact: true }).click();
  await expect(page.getByRole("region", { name: "Difference · modeled priority reduction" })).toBeVisible();
});
