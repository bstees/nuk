# Testing strategy

The test pyramid follows the boundary that owns the behavior.

- **Unit:** attribute/property reflection, form value/reset, normalization, validation, generated
  policy, and pure transformations in Vitest.
- **DOM/accessibility:** representative custom-element and React renderings in a browser-like DOM,
  with axe for rules that do not require a full rendering engine.
- **Story interactions:** visible controls, keyboard sequences, focus, dismissal, and accessible
  queries in Storybook `play` functions.
- **Browser:** Playwright runs Chromium, Firefox, and WebKit against the static Storybook build. It
  verifies key routes, keyboard paths, light/dark overrides, narrow/wide parent containers, reflow,
  and page-level axe scans.
- **Packages:** strict TypeScript, ESLint, Prettier, package build, publint, and tarball inspection.
- **Infrastructure/content:** Terraform format/validate/tests, workflow lint where available, Forge
  AST/conformance/approval gates, SBOM, provenance, dependency review, and CodeQL.

Automated checks cannot establish usability with assistive technology, generated code safety, or
cloud correctness. The accessibility checklist, human approval records, visual inspection, DNS/cost
review, and production environment approvals are required evidence at those boundaries.
