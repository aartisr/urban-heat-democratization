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
  { label: "Modes", shortLabel: "MO", to: "/modes" },
  { label: "Cities", shortLabel: "CI", to: "/cities" },
  { label: "Scenarios", shortLabel: "SC", to: "/scenarios", search: baseScenarioSearch },
  { label: "Exports", shortLabel: "EX", to: "/exports" },
  { label: "Runs", shortLabel: "RU", to: "/runs" },
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
  const appShellRef = useRef<HTMLDivElement | null>(null);
  const resizeStateRef = useRef<{ pointerId: number; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("uhd.sidebar.collapsed");
    const storedWidth = window.localStorage.getItem("uhd.sidebar.width");
    const storedTouched = window.localStorage.getItem("uhd.sidebar.user-touched");
    if (stored === "true") setSidebarCollapsed(true);
    if (storedWidth && Number.isFinite(Number(storedWidth))) {
      setSidebarWidth(clampSidebarWidth(Number(storedWidth)));
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

  const shellLayoutValue = useMemo(() => ({ sidebarCollapsed, sidebarWidth }), [sidebarCollapsed, sidebarWidth]);

  return (
    <AppShellLayoutContext.Provider value={shellLayoutValue}>
      <div ref={appShellRef} className={`app-shell ${sidebarCollapsed ? "app-shell-collapsed" : ""}`}>
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
