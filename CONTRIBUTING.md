# Contributing to Urban Heat Democratization

Thank you for helping make urban-heat evidence more legible, testable, and useful in public life. Contributions are welcome from community members, educators, planners, researchers, designers, and engineers.

## Start with the right record

- Read the [research wiki](docs/wiki/README.md), especially the [evidence and responsible-use guide](docs/wiki/04-evidence-and-responsible-use.md).
- Use the [documentation guide](docs/README.md) to find the current source for status, methods, and community workflows. Keep observed inputs, modeled signals, scenarios, and measured impacts distinct in any new claim.
- For a city-specific contribution, start with the [city onboarding and partnership guide](docs/wiki/05-city-onboarding-and-partnership.md).
- Before proposing a claim about a place or intervention, state its source, date, spatial support, transformation, uncertainty, and intended use.

## Useful ways to contribute

- Report an accessibility, usability, source, or reproducibility issue.
- Improve documentation, plain-language explanation, translations, or learning materials.
- Add a test, correction, or clearly licensed data adapter.
- Propose a bounded community or public-interest pilot with a named data steward and decision owner.

## Contribution standard

Please do not represent an exploratory map, graph signal, or scenario as a health finding, a city-calibrated engineering prediction, or proof that a proposed intervention is equitable. Preserve uncertainty and cite primary sources. Do not submit personal, sensitive, or re-identifiable location data.

## Before opening a pull request

1. Keep the change focused and explain the public question it improves.
2. Run the relevant tests and checks described in the [README](README.md).
3. Update the source, method, and limitation documentation when a public-facing claim changes.
4. Run `python3 scripts/check_docs_links.py` after changing documentation links.
5. Regenerate discovery artifacts when a public route or field-guide page changes:

   ```bash
   cd web && npm run discovery:refresh && npm run discovery:check
   ```

For collaboration that needs discussion before code, open an issue or use the [public collaboration desk](https://urban-heat.ai-aarti.com/contact).

## Local development

Use Python 3.12 and Node.js 22 or newer. From the repository root:

```bash
make setup
make api       # terminal 1
make web       # terminal 2
```

For a change to the API, math, data, or city packages, run `make test-python` and `make validate-packages`. `make test-python` covers both `tests/` and `api/tests/`. For a frontend change, run `make test-web` and `make build`. The [CI workflow](.github/workflows/ci.yml) also runs the browser regression suite, including the Atlas layer check. Include a focused test for behavior that could regress, and explain any check you could not run.

Issues and pull requests are reviewed for correctness, evidence quality, privacy, licensing, accessibility, and maintainability. A maintainer may request changes or decline work that falls outside the project's public-interest and evidence standards. There is no guaranteed review time.

For help, see [Support](.github/SUPPORT.md). Report vulnerabilities through the [Security policy](.github/SECURITY.md), and follow the [Code of conduct](.github/CODE_OF_CONDUCT.md).

Maintainers should follow the [release process](docs/RELEASE_PROCESS.md) before publishing a versioned or citable result.
