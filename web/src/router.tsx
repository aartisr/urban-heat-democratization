import { Suspense, createContext, lazy, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  Outlet,
  Link,
  createRootRoute,
  createRoute,
  createRouter,
  useRouterState,
} from "@tanstack/react-router";

import { AccessWorkspaceSwitcher } from "./components/access-workspace-switcher";
import { defaultSeo, setPageSeo } from "./lib/seo";
const HomePage = lazy(() => import("./routes/home").then((module) => ({ default: module.HomePage })));
const CitiesPage = lazy(() => import("./routes/cities").then((module) => ({ default: module.CitiesPage })));
const CityDetailPage = lazy(() => import("./routes/city-detail").then((module) => ({ default: module.CityDetailPage })));
const ExportsPage = lazy(() => import("./routes/exports").then((module) => ({ default: module.ExportsPage })));
const ModesPage = lazy(() => import("./routes/modes").then((module) => ({ default: module.ModesPage })));
const ScenariosPage = lazy(() => import("./routes/scenarios").then((module) => ({ default: module.ScenariosPage })));
const RunsPage = lazy(() => import("./routes/runs").then((module) => ({ default: module.RunsPage })));
const RunDetailPage = lazy(() => import("./routes/run-detail").then((module) => ({ default: module.RunDetailPage })));

function withPageSuspense(node: JSX.Element) {
  return (
    <Suspense fallback={<section className="panel-card premium-section-card"><p className="muted">Loading view...</p></section>}>
      {node}
    </Suspense>
  );
}

function validateScenariosSearch(search: Record<string, unknown>) {
  return {
    cityId: typeof search.cityId === "string" ? search.cityId : undefined,
    budgetUsd: typeof search.budgetUsd === "number"
      ? search.budgetUsd
      : typeof search.budgetUsd === "string" && Number.isFinite(Number(search.budgetUsd))
        ? Number(search.budgetUsd)
        : undefined,
    focus: typeof search.focus === "string" ? search.focus : undefined,
    sourceLayer: typeof search.sourceLayer === "string" ? search.sourceLayer : undefined,
    selectedLabel: typeof search.selectedLabel === "string" ? search.selectedLabel : undefined,
  };
}

const baseScenarioSearch = {
  cityId: undefined,
  budgetUsd: undefined,
  focus: undefined,
  sourceLayer: undefined,
  selectedLabel: undefined,
};

const navItems: Array<{
  label: string;
  shortLabel: string;
  to: "/" | "/modes" | "/cities" | "/scenarios" | "/exports" | "/runs";
  search?: typeof baseScenarioSearch;
}> = [
  { label: "Overview", shortLabel: "OV", to: "/" },
  { label: "Cities", shortLabel: "CI", to: "/cities" },
  { label: "Scenarios", shortLabel: "SC", to: "/scenarios", search: baseScenarioSearch },
];

const secondaryNavItems: Array<{
  label: string;
  to: "/modes" | "/exports" | "/runs";
  search?: typeof baseScenarioSearch;
}> = [
  { label: "Choose a path", to: "/modes" },
  { label: "Exports", to: "/exports" },
  { label: "Run history", to: "/runs" },
];

const SIDEBAR_MIN_WIDTH = 240;
const SIDEBAR_MAX_WIDTH = 420;
const SIDEBAR_STEP = 16;
const SIDEBAR_LARGE_STEP = 32;
const SIDEBAR_PRESETS = [240, 280, 320, 380, 420];

function clampSidebarWidth(width: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, width));
}

function nextSidebarPreset(currentWidth: number) {
  const nextPreset = SIDEBAR_PRESETS.find((preset) => preset > currentWidth + 4);
  return nextPreset ?? SIDEBAR_PRESETS[0];
}

type AppShellLayoutState = {
  sidebarCollapsed: boolean;
  sidebarWidth: number;
};

const AppShellLayoutContext = createContext<AppShellLayoutState>({
  sidebarCollapsed: false,
  sidebarWidth: 280,
});

export function useAppShellLayout() {
  return useContext(AppShellLayoutContext);
}

function RootLayout() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [focusMode, setFocusMode] = useState(false);
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const resizeStateRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const pages: Record<string, { title: string; description: string; keywords: string[] }> = {
      "/": defaultSeo,
      "/cities": {
        title: "Cities and heat evidence | Urban Heat Democratization",
        description: "Explore city heat evidence, data readiness, and transparent public-interest urban heat workflows.",
        keywords: ["city heat maps", "urban heat data", "heat equity"],
      },
      "/scenarios": {
        title: "Urban heat mitigation scenarios | Urban Heat Democratization",
        description: "Explore transparent, cost-aware urban heat mitigation scenarios and their stated assumptions.",
        keywords: ["heat mitigation scenarios", "urban cooling", "climate adaptation"],
      },
      "/modes": {
        title: "Urban heat learning paths | Urban Heat Democratization",
        description: "Choose an accessible learning and planning path for understanding local heat, evidence, and action.",
        keywords: ["urban heat education", "heat resilience", "climate literacy"],
      },
      "/exports": {
        title: "Urban heat data exports | Urban Heat Democratization",
        description: "Access transparent urban heat planning exports and supporting evidence artifacts.",
        keywords: ["urban heat data", "open climate data", "heat planning"],
      },
    };
    const page = pathname.startsWith("/cities/")
      ? {
          title: "Boston urban heat study | Urban Heat Democratization",
          description: "Inspect Boston urban heat and cooling-access evidence with source context, caveats, and transparent planning tools.",
          keywords: ["Boston urban heat", "Boston heat map", "cooling access Boston", "heat equity"],
        }
      : pages[pathname] ?? {
          title: "Urban heat planning workspace | Urban Heat Democratization",
          description: "A transparent public-interest workspace for urban heat evidence and climate-resilient planning.",
          keywords: defaultSeo.keywords,
        };
    setPageSeo({ ...page, path: pathname });
  }, [pathname]);

  useEffect(() => {
    const stored = window.localStorage.getItem("uhd.sidebar.collapsed");
    const storedWidth = window.localStorage.getItem("uhd.sidebar.width");
    const storedTouched = window.localStorage.getItem("uhd.sidebar.user-touched");
    const storedFocusMode = window.localStorage.getItem("uhd.focus.mode");
    if (stored === "true") setSidebarCollapsed(true);
    if (storedWidth && Number.isFinite(Number(storedWidth))) {
      setSidebarWidth(clampSidebarWidth(Number(storedWidth)));
    }
    if (storedFocusMode === "true") {
      setFocusMode(true);
    }
    if (!storedTouched && pathname.startsWith("/cities/")) {
      setSidebarCollapsed(true);
    }
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable = target && (
        target.tagName === "INPUT"
        || target.tagName === "TEXTAREA"
        || target.tagName === "SELECT"
        || target.isContentEditable
      );
      if (isEditable) {
        return;
      }
      if (event.key === "[") {
        setSidebarCollapsed(true);
        window.localStorage.setItem("uhd.sidebar.user-touched", "true");
      }
      if (event.key === "]") {
        setSidebarCollapsed(false);
        window.localStorage.setItem("uhd.sidebar.user-touched", "true");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("uhd.sidebar.collapsed", sidebarCollapsed ? "true" : "false");
  }, [sidebarCollapsed]);

  useEffect(() => {
    window.localStorage.setItem("uhd.sidebar.width", String(sidebarWidth));
  }, [sidebarWidth]);

  useEffect(() => {
    window.localStorage.setItem("uhd.focus.mode", focusMode ? "true" : "false");
  }, [focusMode]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState || resizeState.pointerId !== event.pointerId) {
        return;
      }
      const nextWidth = resizeState.startWidth + (event.clientX - resizeState.startX);
      setSidebarWidth(clampSidebarWidth(nextWidth));
    };

    const finishResize = () => {
      if (resizeStateRef.current) {
        window.localStorage.setItem("uhd.sidebar.user-touched", "true");
      }
      resizeStateRef.current = null;
      document.body.classList.remove("is-resizing-sidebar");
    };

    const onPointerUp = (event: PointerEvent) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState || resizeState.pointerId !== event.pointerId) {
        return;
      }
      finishResize();
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", finishResize);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", finishResize);
    };
  }, []);

  useEffect(() => {
    appShellRef.current?.style.setProperty("--sidebar-width", `${sidebarWidth}px`);
  }, [sidebarWidth]);

  const toggleSidebar = (collapsed: boolean | ((value: boolean) => boolean)) => {
    window.localStorage.setItem("uhd.sidebar.user-touched", "true");
    setSidebarCollapsed(collapsed);
  };

  const currentView = useMemo(() => {
    if (pathname.startsWith("/cities/")) {
      return {
        title: "City Detail",
        description: "Inspect evidence layers, readiness, and map-first decisions before scenario budgeting.",
      };
    }
    if (pathname.startsWith("/runs/")) {
      return {
        title: "Run Detail",
        description: "Review execution metadata, outputs, and logs to validate what actually ran.",
      };
    }
    const nav = navItems.find((item) => item.to === pathname);
    if (nav) {
      return {
        title: nav.label,
        description: nav.label === "Overview"
          ? "Start from one coherent narrative, then move into city, scenario, export, and run workflows."
          : nav.label === "Modes"
            ? "Choose the audience lens, then keep the same science with role-specific framing."
            : nav.label === "Cities"
              ? "Open a bundled city or onboard a new one without changing the decision workflow."
              : nav.label === "Scenarios"
                ? "Compare tradeoffs with explicit evidence status and uncertainty-aware planning signals."
                : nav.label === "Exports"
                  ? "Download artifacts and package evidence so decisions stay inspectable beyond this app."
                  : "Track queue state and outputs with a clear execution registry.",
      };
    }
    return {
      title: "Urban Heat Workspace",
      description: "Use a single workflow that stays readable from evidence to action.",
    };
  }, [pathname]);

  const cityIdFromPath = pathname.startsWith("/cities/") ? pathname.split("/")[2] : undefined;

  const shellLayoutValue = useMemo(() => ({ sidebarCollapsed, sidebarWidth }), [sidebarCollapsed, sidebarWidth]);

  return (
    <AppShellLayoutContext.Provider value={shellLayoutValue}>
      <div
        ref={appShellRef}
        className={`app-shell ${sidebarCollapsed ? "app-shell-collapsed" : ""} ${focusMode ? "app-shell-focus" : ""} app-shell-editorial`.trim()}
      >
        <aside className={`app-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <div className="app-sidebar-top">
            <div className="brand-card">
              <div className="brand-mark">UH</div>
              {!sidebarCollapsed ? (
                <div>
                  <div className="brand-title">Urban Heat Democratization</div>
                  <div className="brand-subtitle">TanStack-first planning cockpit</div>
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="sidebar-toggle"
              onClick={() => toggleSidebar((value) => !value)}
              aria-label={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
              title={sidebarCollapsed ? "Expand menu" : "Collapse menu"}
            >
              {sidebarCollapsed ? ">>" : "<<"}
            </button>
          </div>
          <nav className="app-nav">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                search={item.search}
                activeProps={{ "aria-current": "page" }}
                className={sidebarCollapsed ? "nav-link-collapsed" : undefined}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {sidebarCollapsed ? item.shortLabel : item.label}
              </Link>
            ))}
            {!sidebarCollapsed ? (
              <details className="app-nav-more">
                <summary>More tools</summary>
                <div>
                  {secondaryNavItems.map((item) => (
                    <Link key={item.to} to={item.to} search={item.search} activeProps={{ "aria-current": "page" }}>
                      {item.label}
                    </Link>
                  ))}
                </div>
              </details>
            ) : null}
          </nav>
          {!sidebarCollapsed ? (
            <div className="app-sidebar-note">
              Pick a city, inspect heat traps, test what-if budgets, and export a plan that people can actually use.
            </div>
          ) : null}
          {!sidebarCollapsed ? <AccessWorkspaceSwitcher /> : null}
        </aside>
        {!sidebarCollapsed ? (
          <div
            className="sidebar-resizer"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize sidebar"
            tabIndex={0}
            onPointerDown={(event) => {
              resizeStateRef.current = { pointerId: event.pointerId, startX: event.clientX, startWidth: sidebarWidth };
              document.body.classList.add("is-resizing-sidebar");
            }}
            onDoubleClick={() => {
              window.localStorage.setItem("uhd.sidebar.user-touched", "true");
              setSidebarWidth((currentWidth) => nextSidebarPreset(currentWidth));
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                const delta = event.shiftKey ? SIDEBAR_LARGE_STEP : SIDEBAR_STEP;
                window.localStorage.setItem("uhd.sidebar.user-touched", "true");
                setSidebarWidth((currentWidth) => clampSidebarWidth(currentWidth - delta));
                return;
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                const delta = event.shiftKey ? SIDEBAR_LARGE_STEP : SIDEBAR_STEP;
                window.localStorage.setItem("uhd.sidebar.user-touched", "true");
                setSidebarWidth((currentWidth) => clampSidebarWidth(currentWidth + delta));
                return;
              }
              if (event.key === "Home") {
                event.preventDefault();
                window.localStorage.setItem("uhd.sidebar.user-touched", "true");
                setSidebarWidth(SIDEBAR_MIN_WIDTH);
                return;
              }
              if (event.key === "End") {
                event.preventDefault();
                window.localStorage.setItem("uhd.sidebar.user-touched", "true");
                setSidebarWidth(SIDEBAR_MAX_WIDTH);
              }
            }}
          />
        ) : null}
        <main className="app-main">
          {sidebarCollapsed ? (
            <button
              type="button"
              className="sidebar-restore"
              onClick={() => toggleSidebar(false)}
              aria-label="Open menu"
            >
              Menu
            </button>
          ) : null}
          <section className="app-main-toolbar" aria-label="Current workflow context">
            <div className="app-main-toolbar-copy">
              <span className="app-main-toolbar-kicker">Workflow context</span>
              <strong>{currentView.title}</strong>
              <p>{currentView.description}</p>
            </div>
            <div className="app-main-toolbar-actions">
              <a
                href="https://github.com/aartisr/urban-heat-democratization/tree/main/docs/wiki"
                className="button-link secondary"
              >
                Read the Wiki
              </a>
              <button
                type="button"
                className={`button-link secondary toolbar-focus-toggle ${focusMode ? "active" : ""}`}
                onClick={() => setFocusMode((value) => !value)}
                aria-pressed={focusMode}
                title={focusMode ? "Disable focus mode" : "Enable focus mode"}
              >
                {focusMode ? "Focus mode on" : "Focus mode off"}
              </button>
              {cityIdFromPath ? (
                <Link
                  to="/scenarios"
                  search={{
                    cityId: cityIdFromPath,
                    budgetUsd: undefined,
                    focus: undefined,
                    sourceLayer: undefined,
                    selectedLabel: undefined,
                  }}
                  className="button-link secondary"
                >
                  Open scenarios for this city
                </Link>
              ) : null}
              {pathname.startsWith("/runs/") ? (
                <Link to="/runs" className="button-link secondary">Back to run registry</Link>
              ) : null}
            </div>
          </section>
          <Outlet />
        </main>
      </div>
    </AppShellLayoutContext.Provider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => withPageSuspense(<HomePage />) });
const citiesRoute = createRoute({ getParentRoute: () => rootRoute, path: "cities", component: () => withPageSuspense(<CitiesPage />) });
const cityDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "cities/$cityId",
  component: () => withPageSuspense(<CityDetailPage />),
});
const scenariosRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "scenarios",
  validateSearch: validateScenariosSearch,
  component: () => withPageSuspense(<ScenariosPage />),
});
const modesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "modes",
  component: () => withPageSuspense(<ModesPage />),
});
const exportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "exports",
  component: () => withPageSuspense(<ExportsPage />),
});
const runsRoute = createRoute({ getParentRoute: () => rootRoute, path: "runs", component: () => withPageSuspense(<RunsPage />) });
const runDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "runs/$runId",
  component: () => withPageSuspense(<RunDetailPage />),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  modesRoute,
  citiesRoute,
  cityDetailRoute,
  scenariosRoute,
  exportsRoute,
  runsRoute,
  runDetailRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
