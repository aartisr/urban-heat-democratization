# Research Sharing and Publication Strategy

**Project:** Urban Heat Democratization  
**Status:** Living strategy — reviewed 2026-08-23  
**Purpose:** Turn careful urban-heat research into material that people can understand, reuse, cite, teach, question, and act on without overstating what the evidence proves.

## The decision in one page

Urban Heat Democratization should not try to share one thing with everyone. It should publish a small, connected **research release package** for each meaningful study or version:

1. **A public story** — a short, plain-language explanation of what changed, why it matters, and what it does *not* establish.
2. **A living interactive experience** — the public app, optimized for exploration rather than treated as the sole record of a result.
3. **A citable record** — a versioned release with a DOI, citation metadata, release notes, and a stable landing page.
4. **A reproducibility record** — pinned code, source-data provenance, method/parameter notes, environment details, checksums where practical, and explicit limitations.
5. **Audience-ready companions** — an accessible one-page brief, a technical report/notebook, a classroom/community kit, and a partner briefing when relevant.

### RSS recommendation

**Keep and maintain the existing Atom feed at `/feed.xml`; do not build a second RSS feed yet.** Atom is a standards-track web-syndication format designed for feeds and news-style entries. The current project already links an Atom feed from the site and documents it in the README. A duplicate RSS 2.0 feed would add maintenance work without making the research more credible or citable.

Add an RSS 2.0 feed only if a verified audience, partner CMS, or newsletter tool cannot consume Atom. In that case, generate RSS and Atom from one source of truth so titles, dates, canonical URLs, and caveats never drift.

The urgent gap is not syndication: it is a repeatable, citable, independently understandable release process.

## What the project already has

The foundation is unusually strong:

| Existing asset | Why it matters | Keep current by |
| --- | --- | --- |
| Public application and Boston bundled study experience | Lets residents, educators, planners, and researchers inspect the work directly. | Pair every major result with a stable, non-interactive explanation. |
| Detailed wiki and study/classroom guides | Holds methods, limits, vocabulary, and teaching context. | Link directly to the exact relevant section from every release. |
| Source repository and MIT license | Makes the software inspectable and reusable. | Add version-specific citation and archival metadata. |
| `llms.txt`, `humans.txt`, sitemap, structured metadata, and canonical URLs | Improves honest machine and search discovery. | Treat them as signposts, not evidence or ranking guarantees. |
| Atom feed at `web/public/feed.xml` | Provides a subscription-ready update stream. | Publish an entry for each substantive public release, correction, or methodology change. |
| Evidence, provenance, and responsible-use documentation | Creates the basis for public trust. | Make the caveats visible wherever a result is shared. |

## What is missing before a serious public research release

These are the highest-value additions, in order.

| Priority | Add | Why it is necessary | Ready when |
| --- | --- | --- | --- |
| P0 | **Release policy and claim register** | Prevents a polished web page from being mistaken for a validated causal or health finding. | Every public claim has an owner, evidence source, date, scope, and limitation. |
| P0 | **CITATION.cff** | Tells GitHub and researchers exactly how to cite the software. | A valid root-level file names the project, version, authors/contributors, license, repository, and preferred citation. |
| P0 | **Versioned DOI archive** | Creates a durable citation target for a specific release. | A public Git tag/release is archived in a repository such as Zenodo, with a concept DOI and a version DOI. |
| P0 | **Release notes / CHANGELOG** | Makes scientific and operational changes visible, including corrections. | Each release says what changed in methods, data, UI interpretation, and known limitations. |
| P0 | **Provenance manifest** | Lets a reader trace a result to source data, processing, parameters, software version, and date. | The package contains a machine-readable manifest plus a readable summary. |
| P1 | **Citable technical report** | Gives a stable, printable record that a map alone cannot provide. | A PDF/HTML report covers question, data, methods, findings, uncertainty, limits, and references. |
| P1 | **Data licensing matrix** | Source data may have terms that differ from the MIT code license. | Every included, derived, and linked dataset has source, license/terms, access date, processing status, and redistribution decision. |
| P1 | **Accessible public brief** | Makes the research usable before a reader becomes a domain expert. | A one- or two-page plain-language brief passes an accessibility and plain-language review. |
| P1 | **Contributor/credit record** | Preserves fair attribution beyond a single visible author line. | `CITATION.cff`, release metadata, and the report declare roles and contributors; Aarti S Ravikumar is credited as creator/lead author where accurate. |
| P2 | **Partner and outreach kit** | Lets trusted intermediaries carry the work into real civic settings. | Each kit has a defined audience, a suggested use, discussion prompts, downloadable assets, and a contact path. |

## The research release package

Publish these together when a result is important enough to present externally. A release can be a Boston study update, a new city study, a methodology revision, a data refresh, or a correction.

### 1. Public-facing page: explain before asking people to explore

The release page should answer, in this order:

- **What did we learn?** One sentence in everyday language.
- **Why does it matter locally?** Name the city/place, decision context, and affected public question.
- **What can a person do here?** A single primary action in the app.
- **What evidence supports it?** Link to the report, data/provenance, and code version.
- **What does it not mean?** Put the most important limitation near the result, not only in a methods appendix.
- **When was it produced and what version is this?** Include a clear date, release version, and DOI once issued.

Avoid treating a modeled heat pattern, an equity proxy, or a scenario comparison as a measured health effect, an intervention guarantee, or a procurement recommendation. A shareable claim must remain true when separated from its visual context.

### 2. Technical report: make the science independently inspectable

For each research release, provide a durable report in accessible HTML and printable PDF. It should contain:

- Research question and intended decision use.
- Study geography, population/area definitions, and time period.
- Input data: source, acquisition date, license/terms, resolution, processing, exclusions, and known bias.
- Methods: equations or model links, parameter choices, assumptions, validation status, and why the chosen method fits the question.
- Results: figures and tables with units, uncertainty, spatial/temporal scope, and direct links to underlying artifacts.
- Interpretation: what evidence supports, what is inferred, what is unknown, and which local knowledge is needed.
- Reproducibility: exact software tag/commit, environment, commands, inputs, output hashes where feasible, and rerun instructions.
- Ethics and governance: privacy, equity, indigenous/community data governance where applicable, and feedback/correction contact.

Use a report, not a visual dashboard, as the source a journalist, peer reviewer, teacher, or city staff member can archive and cite.

### 3. Citable software and data: make versions first-class research outputs

The FAIR principles call for findable, accessible, interoperable, and reusable research objects; they explicitly include algorithms, tools, and workflows, not only data. Data-citation guidance similarly emphasizes credit, persistent identifiers, access, specificity, provenance, and fixity. In practice:

1. Create a root `CITATION.cff` for Urban Heat Democratization. GitHub recognizes this filename and exposes citation guidance to repository visitors.
2. Adopt release tags such as `v1.0.0` and never move or overwrite a published tag.
3. Connect the repository to Zenodo (or an institution-approved repository). Archive each tagged GitHub release. Preserve both:
   - a **concept DOI** for “the project, any version,” and
   - a **version DOI** for the exact version used in a report or analysis.
4. Include release metadata: title, authors/contributor roles, ORCID iDs only with the owner’s consent, publication date, version, keywords, license, related identifiers, and description.
5. Deposit an artifact bundle for the release when licensing permits: report, data/provenance manifest, small derived data or code to fetch it, figure/table exports, and checksums.
6. Cite the specific version DOI, data version, and software version beside each published result.

Zenodo supports `CITATION.cff` and `.zenodo.json` for GitHub-originated software releases. If both are present, its documentation says `.zenodo.json` takes precedence for release metadata; choose a single canonical metadata source or document which fields are authoritative to prevent contradictions.

### 4. Public brief: earn attention without collapsing the science

Create a one- or two-page brief for every major study. It is not a press release with caveats removed. It should have:

- A human title and a one-sentence takeaway.
- A small “What this is / is not” panel.
- Three maximum findings, each linked to supporting evidence.
- One annotated figure or map, plus a text alternative and downloadable data table.
- A “How to use this in a community conversation” section with three questions.
- A citation box, release date, DOI/version, license, and contact/correction link.

Make the first public Boston brief the pilot template; do not introduce a new city before the template works for an informed resident, a teacher, and a city practitioner.

### 5. Distribution: use trusted pathways, not only social posts

Different audiences need different products and messengers.

| Audience | Best shareable item | Distribution path | Success signal |
| --- | --- | --- | --- |
| Residents and neighborhood groups | Plain-language brief, interactive city page, meeting handout | Community organizations, libraries, neighborhood associations, local newsletters, facilitated sessions | People can accurately state what the result means and its key limit. |
| Educators and students | Classroom guide, downloadable visuals/data, short lesson flow | Schools, universities, libraries, STEM/climate programs | A facilitator can run a session without project staff present. |
| City staff and elected officials | Decision brief, technical appendix, scenario walkthrough | Planning/public-health/climate offices; formal briefing; procurement-neutral demo | The work informs questions and options without being misrepresented as a mandate. |
| Researchers | DOI release, report, code/data provenance, citation file | Discipline networks, conferences, institutional repositories, scholarly profiles | A third party can locate, cite, and reproduce the specific version. |
| Journalists and communicators | Media backgrounder, visual asset pack, spokesperson/contact, method/limits box | Embargoed briefings only when ready; local science/environment desks | Coverage links to methods and reports uncertainty correctly. |
| Funders and partners | Outcomes/learning brief, roadmap, governance model | Grant reports, partner meetings, invitations to support a named release milestone | Support expands responsibly and preserves public-interest governance. |

Start locally and relationally: a city-specific briefing with groups already trusted by residents will usually be more useful than trying to manufacture national attention. Never publish a neighborhood-facing finding without a way for local people to question, contextualize, or correct it.

## Atom/RSS operating policy

The existing Atom feed is the release-notification channel. It should be updated whenever any of these occur:

- A public study, city package, technical report, or DOI release is published.
- A meaningful data refresh, methodology change, or correction affects interpretation.
- A new classroom/community/partner artifact is published.
- A retraction, caveat upgrade, or known issue needs subscribers to revisit a result.

Each entry needs:

| Field | Requirement |
| --- | --- |
| Stable ID | Never change it after publication. |
| Title | Name the city/topic and result without sensationalism. |
| Published and updated dates | Distinguish first publication from later corrections. |
| Canonical URL | Link to the durable release page or report landing page, not a transient app state. |
| Summary | One finding, audience/context, and the key caveat. |
| Evidence links | Report, DOI, data/provenance, and software tag where available. |
| Category | For example: `study`, `methods`, `data-update`, `correction`, `teaching`, or `community`. |

Atom entries need stable identifiers and updated timestamps under the Atom standard. Treat corrections as a release practice, not an embarrassment: update the entry, leave a visible correction note on the landing page, and preserve the original claim/version for auditability.

## A 90-day sequence

### Days 1–14: establish the integrity baseline

1. Inventory every externally shareable statement, dashboard metric, map layer, and scenario output.
2. Create a claim register with: claim, evidence, geography/time period, evidence strength, owner, source link, version, limitation, and last review date.
3. Decide what is public now, what is research-only, and what needs a local partner review before publication.
4. Create the release checklist and correction policy below.
5. Audit data terms and provenance before packaging or redistributing any source/derived data.

### Days 15–45: make the first release citable and repeatable

1. Add `CITATION.cff`; validate it using the CFF schema tools/GitHub preview.
2. Prepare a metadata file for the chosen DOI repository and settle authorship/contributor roles.
3. Tag the first stable public research release and archive it to obtain the DOI.
4. Create a Boston technical report and plain-language public brief from the same claim register.
5. Add a provenance manifest and reproducibility instructions to the release bundle.
6. Add a visible “cite this study” and “report a problem” link to the public release page.

### Days 46–90: distribute, listen, and improve

1. Publish the release page, report, and Atom feed entry together.
2. Run small facilitated demos with at least one resident/community audience, one educator audience, and one planning/public-health audience.
3. Capture what participants misunderstood, what they needed next, and whether the limitations were legible.
4. Publish a short learning note: what feedback changed, what remains uncertain, and the next release date or decision point.
5. Only then scale outreach through partner newsletters, events, a conference submission, and carefully prepared media outreach.

## Release checklist

Do not publish a research result until every applicable box is true.

- [ ] The claim can be stated in one sentence without implying causality, health impact, or intervention certainty beyond the evidence.
- [ ] Geography, time period, units, resolution, and intended use are named.
- [ ] Inputs and transformations have provenance; each source’s license/terms and redistribution status are recorded.
- [ ] Methods, parameters, and validation status are documented.
- [ ] The most decision-relevant limitation is visible next to the finding.
- [ ] Maps/figures have alt text, text equivalents, color-independent encodings where possible, and downloadable/tabular alternatives.
- [ ] The report links to a specific code version, data version, and artifact manifest.
- [ ] Release metadata includes authorship/contributor roles, license, date, version, and persistent identifiers where available.
- [ ] A correction path and contact are public.
- [ ] A knowledgeable non-specialist has tested the brief and can explain both the finding and its limit.
- [ ] The feed entry, release notes, landing page, report, and app all point to the same canonical URLs and version.

## Minimal templates

### Release note / feed entry

```text
Title: [City] — [plain-language result]
Published: YYYY-MM-DD
Updated: YYYY-MM-DD (only if corrected or revised)
Version: vX.Y.Z

What we found: [one evidence-bounded sentence]
Why it matters: [local decision or public question]
What this does not show: [most important limitation]

Explore: [canonical release page]
Read: [technical report]
Cite: [version DOI / citation]
Reproduce: [repository tag / provenance manifest]
Data terms: [license/provenance page]
Correction/contact: [public path]
```

### Citation box

```text
Urban Heat Democratization. [City study title], version X.Y.Z (YYYY).
Created by Aarti S Ravikumar and contributors. DOI: [version DOI].
Software: [repository tag]. Data/provenance: [landing page].
```

Use the actual contributor list, titles, and roles for each release; do not add people merely for prestige, and do not omit material contributors.

## Governance and measurement

Measure public value rather than raw page views. A small set of useful indicators:

- **Comprehension:** after a short session, can people explain the main finding and its caveat?
- **Actionability:** can a facilitator use the material to start a grounded discussion or identify a next question?
- **Reproducibility:** can an independent reviewer retrieve the exact release, identify inputs, and rerun or inspect the method?
- **Attribution:** do citations, partner materials, and media use the correct version and credit contributors?
- **Equity and trust:** did people most affected by the topic have a real way to respond before and after release?
- **Correction quality:** are errors/version changes visible, dated, and linked to affected outputs?

Avoid optimizing for social reach alone. A widely circulated but context-free heat map can create harm, especially when it is read as an individual-risk score, a health diagnosis, or proof of a specific policy outcome.

## Decisions to make now

1. **Repository choice:** confirm Zenodo or select an institutional repository with durable DOI support and acceptable stewardship terms.
2. **Authorship and roles:** decide the accurate release credit line and collect ORCID iDs only from people who choose to provide them. ORCID can distinguish researchers with a persistent identifier; it should not be used to infer authorship.
3. **First release scope:** choose one bounded Boston study/update rather than trying to archive every app feature at once.
4. **Public review partners:** identify at least one community-facing and one technical/city-facing reviewer for the first release.
5. **Data distribution policy:** determine which raw, derived, and aggregate data can be redistributed, which must be linked only, and which require access controls.

## Sources and standards consulted

- [IETF RFC 4287 — The Atom Syndication Format](https://datatracker.ietf.org/doc/rfc4287/)
- [GitHub Docs — About CITATION files](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-citation-files)
- [Zenodo — Describe software from GitHub](https://help.zenodo.org/docs/github/describe-software/)
- [Citation File Format — schema guide](https://github.com/citation-file-format/citation-file-format/blob/main/schema-guide.md)
- [FAIR Guiding Principles](https://doi.org/10.1038/sdata.2016.18)
- [FORCE11 Joint Declaration of Data Citation Principles](https://force11.org/group/joint-declaration-of-data-citation-principles-final/)
- [FORCE11 Software Citation Principles](https://force11.org/info/software-citation-principles-published-2016/)
- [ORCID — What is ORCID?](https://support.orcid.org/hc/en-us/articles/360006973993-What-is-ORCID)

## Related project documents

- [Research wiki](wiki/README.md)
- [Evidence, provenance, and responsible use](wiki/04-evidence-and-responsible-use.md)
- [City onboarding and community partnership](wiki/05-city-onboarding-and-partnership.md)
- [Roadmap, governance, and contribution](wiki/06-roadmap-governance-and-contribution.md)
- [Boston study guide](BOSTON_STUDY_GUIDE.md)
- [Boston classroom guide](BOSTON_CLASSROOM_GUIDE.md)
- [Artifact strategy](ARTIFACT_STRATEGY.md)

