# Release process

This project has not declared a stable versioned release. Until it does, `main` is the maintained development line and the live site is a public demonstration. A Git commit or deployment is not by itself a validated research release.

For a versioned release, the maintainer should:

1. Choose a version and freeze the code, data, and documentation that will be cited. Record the commit and deployment URL.
2. Run the Python suite, city-package validator, web unit tests, production build, discovery check, performance budget, and browser smoke test. Record failures and exceptions in the release notes.
3. Review source provenance, licenses, privacy, accessibility, security reports, and the [evidence boundaries](wiki/04-evidence-and-responsible-use.md). State which results are measured, modeled, or illustrative.
4. Publish release notes that distinguish code, interface, method, and data changes. Describe corrections and known limitations, including any change that alters interpretation of prior results.
5. Create an immutable `vX.Y.Z` tag and GitHub release only after the release candidate is reviewed. Attach a reproducible manifest and checksums when publishing a study artifact bundle. Update [CITATION.cff](../CITATION.cff) with a version and date only when they are real.
6. If an external archive issues a DOI, link that exact DOI from the release and citation record. Never invent a DOI or imply independent validation.

The [research sharing strategy](RESEARCH_SHARING_AND_PUBLICATION_STRATEGY.md) describes the additional report, provenance, and community review needed for a citable study release.
