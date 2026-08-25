import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { createColumnHelper, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { Link } from "@tanstack/react-router";

import { WorkflowHeader } from "../components/workflow-header";
import { listCityExperiences, listRuns } from "../lib/api";
import type { RunRecord } from "../lib/types";

const columnHelper = createColumnHelper<RunRecord>();

export function RunsPage() {
  const runsQuery = useQuery({ queryKey: ["runs"], queryFn: () => listRuns() });
  const experiencesQuery = useQuery({ queryKey: ["city-experiences"], queryFn: listCityExperiences });

  const columns = useMemo(() => [
    columnHelper.accessor("id", {
      header: "Run ID",
      cell: (info) => <Link to="/runs/$runId" params={{ runId: info.getValue() }}>{info.getValue()}</Link>,
    }),
    columnHelper.accessor("cityId", { header: "City" }),
    columnHelper.accessor("scenario", { header: "Scenario" }),
    columnHelper.accessor("queueJobId", {
      header: "Queue Job",
      cell: (info) => info.getValue() ?? "N/A",
    }),
    columnHelper.accessor("status", { header: "Status" }),
    columnHelper.accessor("progress", { header: "Progress", cell: (info) => `${info.getValue()}%` }),
    columnHelper.accessor("updatedAt", { header: "Updated" }),
  ], []);

  const bundledCityIds = new Set((experiencesQuery.data ?? []).filter((experience) => experience.bundled).map((experience) => experience.cityId));
  const bundledRuns = (runsQuery.data ?? []).filter((run) => bundledCityIds.has(run.cityId));
  const featuredBundledCity = (experiencesQuery.data ?? []).find((experience) => experience.bundled) ?? experiencesQuery.data?.[0];
  const queued = (runsQuery.data ?? []).filter((run) => run.status === "queued" || run.status === "running").length;

  const table = useReactTable({
    data: runsQuery.data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="page-stack runs-page">
      <WorkflowHeader wide eyebrow="Runs" title="Track analysis jobs, outputs, and the evidence trail." description="This registry keeps the app honest: you can see what ran, what finished, and which workflows still need attention." />

      <div className="panel-grid two-col premium-story-grid">
        <article className="panel-card premium-section-card">
          <h2>Registry snapshot</h2>
          <div className="metric-list">
            <div><span>Total runs</span><strong>{runsQuery.data?.length ?? 0}</strong></div>
            <div><span>Bundled-city runs</span><strong>{bundledRuns.length}</strong></div>
            <div><span>Queued or active</span><strong>{queued}</strong></div>
          </div>
          <p className="muted">
            Source trail: run rows are execution records, while the scenario that produced them carries the source-backed cost and benchmark notes.
          </p>
        </article>
        <article className="panel-card premium-section-card">
          <h2>Guided study workflow</h2>
          <p className="muted">
            Bundled cities model the most complete workflow in the app today: inspect a run, review attached artifacts, and trace what scenario was queued.
          </p>
          <p className="muted">
            Source trail: follow the linked scenario to see the verified seed costs, comparative ranking sources, and benchmark anchors behind the run.
          </p>
          <div className="quick-links">
            {featuredBundledCity ? (
              <Link to="/cities/$cityId" params={{ cityId: featuredBundledCity.cityId }} className="button-link">Open bundled city</Link>
            ) : null}
            <Link to="/scenarios" search={{ cityId: undefined, budgetUsd: undefined, focus: undefined, sourceLayer: undefined, selectedLabel: undefined }} className="button-link secondary">Test scenarios</Link>
          </div>
        </article>
      </div>

      <article className="panel-card premium-section-card">
        <h2>Run index</h2>
        <p className="muted">Run entries are intentionally lean; the evidence trail lives in the scenario and benchmark views they came from.</p>
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
    </section>
  );
}
