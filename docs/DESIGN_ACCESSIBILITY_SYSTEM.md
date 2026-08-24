# Design and accessibility system

Urban Heat Democratization uses a small semantic color and surface system in
`web/src/styles.css`. Its job is to keep the visual experience expressive while
making every research claim, control, and explanation easy to read.

## Source of truth

The `:root` variables beginning with `--color-` and the shared surface-context
rules near the end of `web/src/styles.css` are the approved choices for
readable UI text, links, focus treatment, and evidence-status labels.

| Need | Token |
| --- | --- |
| Primary reading text | `--color-text-primary` |
| Supporting text | `--color-text-secondary` |
| Links | `--color-link` |
| Primary interactive color | `--color-accent` |
| Text on dark/visual surfaces | `--color-on-dark`, `--color-on-dark-muted` |
| Keyboard focus | `--color-focus` |
| Evidence labels | `--color-status-*` with paired `--surface-status-*` |

Use color as reinforcement, never as the sole way to communicate status. Every status must also have a written label such as **source-backed**, **benchmark**, **proxy**, or **incomplete**.

## Guardrail

Run the token contrast check before shipping UI work:

```bash
cd web && npm run check:contrast
```

The guardrail verifies WCAG AA contrast for normal-size text (at least 4.5:1)
and uses a stricter 7:1 target for principal reading text. It also checks the
dark science formula and disclosure treatments used by the city and scenario
workflows. Unusual visual surfaces still need a component-level review before
they are introduced.

## Surface contract

The app intentionally contains both light editorial surfaces and dark science
or map surfaces. They are never interchangeable.

- Light cards use `--color-text-primary` and `--color-text-secondary`.
- Dark/visual research surfaces inherit `--surface-text` and
  `--surface-muted-text`, which resolve to `--color-on-dark` tokens.
- KaTeX and other math inside dark science contexts inherit the tested
  `--math-ink` treatment.
- Accent chips, evidence states, and map legends keep their component-specific
  colours because those colours convey meaning in addition to decoration.

The light `.science-banner` is explicitly excluded from the dark-surface
contract. This avoids the common failure mode where pale text is inherited onto
a light background and becomes difficult to see.

## Responsive shell contract

The application shell is one shared component, so responsive behavior is also
centralized:

- At wide widths it is a resizable sidebar plus content workspace.
- At 1080px and below it becomes a single-column layout with a full-width
  navigation header.
- The sidebar and main content reset their desktop grid placement at that
  breakpoint. This prevents implicit grid columns from compressing navigation
  into a narrow vertical rail.
- City pages may use the compact menu state to keep the evidence view focused;
  the visible **Menu** control expands the full navigation.

## Maintenance rule

When a new surface or status is needed, add a semantic token and a test case to
`web/scripts/check-contrast-tokens.mjs` first. Do not introduce a one-off
low-contrast text color in a component or route stylesheet. For a new
responsive shell behavior, test the shared shell at desktop and 390px mobile
width before adding a page-specific workaround.
