# Version 1 implementation plan

- Status: **implemented and locally verified; pending owner review**
- Owner: Brent Stees
- Implementation date: 2026-11-01
- Local verification completed: 2026-11-10

## Objective

Deliver a locally reviewable, production-oriented first version of a semantic component system, its
documentation and editorial applications, and the guarded workflows needed to extend and host them.
No task in this plan publishes, deploys, applies Terraform, buys a service, or requires a
credential.

## Decisions fixed for v1

- **Workspace:** pnpm workspaces without an additional monorepo task runner. The graph is small,
  recursive scripts are sufficient, and this avoids another privileged build dependency.
- **Namespace:** public autonomous custom elements use `nuk-` by default; a central, validated
  registry can define the same constructors under a consumer prefix. Public events follow the
  selected prefix. npm packages use `@nuk-ui/*`; CSS custom properties stay `--nuk-*` as a stable
  theme contract rather than runtime-generated CSS.
- **Rendering model:** authored custom elements own framework-neutral behavior. React adapters are
  thin, typed surfaces. Native elements remain visible in the accessibility tree and are used
  directly whenever a custom element would weaken platform behavior.
- **CSS:** structural CSS travels with elements; optional design tokens and visual themes are
  separate packages. Components use cascade layers, logical properties, intrinsic sizing, container
  queries, `:has()`, forced-colors rules, and progressive enhancement.
- **Documentation:** Storybook is a local/static build artifact. The digest uses Astro static output
  and no runtime server.
- **Generation boundary:** public documentation and an approved behavior specification may enter the
  clean-room process; third-party implementation source may not. Generated candidates cannot become
  package source without an explicit human approval record.
- **Cloud target:** review-only AWS S3 + CloudFront + ACM with separate distributions for docs and
  digest, GitHub OIDC for a future deployment role, and GoDaddy retaining registrar/DNS authority
  unless the owner deliberately delegates validation records.

## Work streams and exit criteria

### 1. Foundations and packages

- Strict TypeScript, linting, formatting, pinned dependencies, Changesets, license, notices, and
  package-export verification.
- Tokens, theme, custom elements, React adapters, and plain HTML/React examples.
- Representative catalog: button/link; text field/textarea/select; checkbox/radio/switch; field
  help/error; disclosure; tabs; dialog; menu; table; alert/status; card/article; navigation and
  breadcrumbs; stack/cluster/grid primitives.

Exit: package builds and type checks pass; unit and accessibility tests cover state and keyboard
behavior; package tarballs expose only intentional files.

### 2. Documentation and editorial surfaces

- Storybook autodocs, controls, themes, accessibility addon, interaction stories, width harnesses,
  token documentation, and contribution guidance.
- Static digest with home, archive, issue, topic, sources, and methodology views; canonical/social
  metadata, RSS, and sitemap.
- Curated source manifest, offline fixtures, deterministic deduplication, citation/quotation checks,
  and review-only issue generation.

Exit: both static builds succeed and are visually/keyboard inspected locally in light, dark, narrow,
and wide contexts.

### 3. Clean-room Forge proof

- Versioned intake policy, provenance record, behavior/spec schema, prompt, generator, static
  analyzer, conformance tests, report, SBOM, and approval gate.
- One small permitted example moves from normalized spec to a candidate and report but remains
  pending human acceptance.

Exit: deterministic proof command succeeds, unsafe fixtures fail for the documented reasons, and a
promotion attempt without human approval fails closed.

### 4. Delivery and infrastructure

- Pull-request, main, release, weekly-draft, CodeQL, dependency-review, browser/accessibility,
  artifact, provenance, and manually gated deployment workflows.
- Review-only Terraform for two static sites, HTTPS, headers, cache policy, access logs, budget
  notifications, environment separation, backend bootstrap guidance, OIDC, validated variables, and
  outputs.

Exit: action permissions are least privilege, third-party actions are full-SHA pinned, Terraform
formats and validates without applying, and no workflow can publish a generated draft directly.

## Verification matrix

| Concern            | Automated evidence                                     | Human evidence                        |
| ------------------ | ------------------------------------------------------ | ------------------------------------- |
| Semantics          | DOM/unit tests, axe, HTML assertions                   | Accessibility checklist               |
| Interaction        | Vitest and Storybook play functions                    | Keyboard and screen-reader spot check |
| Reflow/theme       | Playwright container-width checks                      | Narrow/wide light/dark review         |
| API quality        | strict type check, publint, package tarballs           | Changeset/API review                  |
| Supply chain       | lockfile, dependency review, CodeQL, SBOM              | provenance/license review             |
| Generated code     | AST policy, conformance tests, approval gate           | mandatory source review               |
| Editorial accuracy | citations, dates, quote budget, deterministic fixtures | Brent edits/approves draft PR         |
| Infrastructure     | format/validate/test without apply                     | cost, DNS, and production approval    |

## Explicitly deferred

- Publishing packages, deploying sites, applying Terraform, buying or configuring cloud/DNS
  services, and creating live API integrations.
- Browser-matrix claims beyond the documented policy until CI runs on the target hosted runners.
- A stable `1.0.0` API. Version `0.1.x` communicates that review may still change details.
