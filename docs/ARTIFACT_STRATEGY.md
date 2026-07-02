# Artifact Strategy

## Purpose

This repository mixes source code, bundled scientific reference artifacts, and locally generated runtime products. The goal of this policy is to keep Git history useful, reproducible, and reviewable.

This policy also protects a broader standard: the repository should make only
claims that can be traced to code, tests, public sources, bundled evidence, or
explicitly labeled assumptions.

If something is uncertain, benchmark-based, proxy-derived, or incomplete, that
status should remain visible.

## Claim discipline

Apply these rules whenever documentation, artifacts, or product copy describe a
result:

1. verified claims require a verifiable source or reproducible generation path
2. benchmark claims must say they are benchmarks
3. proxy metrics must say they are proxies
4. generated outputs must say whether they are deterministic fixtures or mutable runtime products
5. local examples must not be generalized into universal truths without evidence

The repo should prefer an honest limitation over a polished overclaim.

## What belongs in Git

Commit these categories:

- Source code in `api/`, `core/`, `scripts/`, `tests/`, and `web/src/`
- Human-authored docs in `docs/`
- Small bundled reference artifacts required for deterministic demos or tests
- Snapshots that are intentionally used as regression fixtures
- Configuration files needed to build, test, or run the project

## What should not be committed

Do not commit these categories:

- Local virtual environments and package caches
- Build outputs such as `web/dist/`
- Playwright outputs such as `web/test-results/` and `web/playwright-report/`
- Coverage files and Python tool caches
- Machine-local editor state or temporary probes
- Runtime data generated under `data/runtime/`

## Bundled data standard

Bundled data is allowed in Git only when all of the following are true:

- It is required for the product’s default Boston experience or deterministic automated tests
- It is reasonably small and reviewable
- It has stable provenance that can be documented in `docs/`
- Regenerating it on every clone would be more expensive or more brittle than storing it

If a data artifact fails those checks, it should move to an external artifact workflow rather than staying in Git.

## Runtime data standard

Runtime outputs belong outside source control.

Examples:

- live thermal bridge JSON refreshed during local experiments
- SQLite mirrors and mutable JSON state
- exported reports generated during manual exploration
- local test run outputs

These should be written to ignored directories such as `data/runtime/`, `outputs/`, or tool-specific output folders.

## Review rules for new artifacts

When adding a new artifact to the repo, answer these questions in the PR or commit notes:

1. Is it source, fixture, or generated output?
2. Why must it live in Git instead of being regenerated or downloaded?
3. What code or test path depends on it?
4. What is the provenance or generation path?
5. What claims in the product or docs will rely on this artifact?

If those answers are weak, the artifact probably should not be committed.

## Operational guidance

- Prefer storing generation logic in `scripts/` and committing the script, not the transient output.
- Prefer test fixtures that are minimal and deterministic.
- Keep large generated outputs out of reviews unless they are intentional golden snapshots.
- When in doubt, add the path to `.gitignore` first and explicitly justify any later exception.
