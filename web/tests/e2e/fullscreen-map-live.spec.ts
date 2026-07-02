import { expect, test } from "@playwright/test";

test("live backend: full page map toggle does not freeze", async ({ page }) => {
  test.skip(!process.env.E2E_LIVE_BACKEND, "Set E2E_LIVE_BACKEND=1 to run against live backend");
  const toggleCycles = Math.max(1, Number(process.env.FULLSCREEN_TOGGLE_CYCLES ?? "3"));
  test.setTimeout(Math.max(120_000, 30_000 + toggleCycles * 12_000));

  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto("/cities/boston?mapDebug=1", { waitUntil: "domcontentloaded" });

  const loadInteractiveAtlas = page.getByRole("button", { name: "Load interactive atlas" });
  const openButton = page.getByRole("button", { name: "Open full page map" });

  if (!(await openButton.isVisible())) {
    await expect(loadInteractiveAtlas).toBeVisible({ timeout: 40_000 });
    const mapResponsePromise = page.waitForResponse(
      (response) => response.url().includes("/api/v1/cities/boston/map"),
      { timeout: 40_000 },
    );

    await loadInteractiveAtlas.click({ force: true });
    const mapResponse = await mapResponsePromise;
    expect(mapResponse.ok(), `Map endpoint failed with status ${mapResponse.status()}`).toBeTruthy();

    await expect(loadInteractiveAtlas).toHaveCount(0, { timeout: 30_000 });
  }

  await expect(page.getByText("Map data is not available for this city yet.")).toHaveCount(0);
  await expect(openButton).toBeVisible({ timeout: 40_000 });

  await openButton.click({ timeout: 10_000 });
  await expect(page.locator("article.map-card-fullpage")).toBeVisible({ timeout: 20_000 });

  await page.keyboard.press("Escape");
  await expect(page.locator("article.map-card-fullpage")).toHaveCount(0, { timeout: 20_000 });

  for (let i = 0; i < toggleCycles; i += 1) {
    await openButton.click({ timeout: 10_000 });
    await expect(page.locator("article.map-card-fullpage")).toBeVisible({ timeout: 20_000 });

    await page.locator(".map-fullpage-exit").click({ timeout: 10_000 });
    await expect(page.locator("article.map-card-fullpage")).toHaveCount(0, { timeout: 20_000 });

    await page.getByRole("button", { name: "Reset extent" }).click({ timeout: 10_000 });
    await expect(page.locator(".maplibre-stage")).toBeVisible({ timeout: 20_000 });
  }

  const fatalPageErrors = pageErrors.filter((message) =>
    /Maximum update depth exceeded|too much recursion|Cannot update a component while rendering/i.test(message),
  );
  const freezeSignals = consoleErrors.filter((message) =>
    /Maximum update depth exceeded|too much recursion|ResizeObserver loop limit exceeded/i.test(message),
  );

  expect(fatalPageErrors, `Page errors: ${pageErrors.join(" | ")}`).toEqual([]);
  expect(freezeSignals, `Console errors: ${consoleErrors.join(" | ")}`).toEqual([]);
});
