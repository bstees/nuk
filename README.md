# nuk component system

A semantic-first component monorepo with standards-based `nuk-*` custom elements, typed React
adapters, a separate theme layer, a local Storybook, a static UI/UX digest, and a review-gated
clean-room component translation workflow.

This repository is intentionally local-first. Nothing in the default scripts publishes, deploys,
applies infrastructure, or requires credentials.

## Packages and apps

| Workspace            | Purpose                                                                              |
| -------------------- | ------------------------------------------------------------------------------------ |
| `packages/elements`  | Framework-neutral custom elements and structural CSS                                 |
| `packages/react`     | Typed React 19 adapters over the same public behaviors                               |
| `packages/theme`     | Optional light, dark, and high-contrast presentation                                 |
| `packages/tokens`    | Versioned CSS and TypeScript design tokens                                           |
| `packages/forge`     | Clean-room specification, generation, analysis, and approval proof of concept        |
| `packages/editorial` | Deterministic feed intake and review-draft generation                                |
| `apps/storybook`     | Component documentation, demos, interaction stories, and accessibility configuration |
| `apps/digest`        | Fully static editorial digest, archive, topics, sources, RSS, and sitemap            |
| `infra/terraform`    | Review-only AWS static-hosting infrastructure; never applied by repository scripts   |

## Start locally

Requirements: Node 24+, pnpm 11+, and a modern browser.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm dev:storybook
pnpm dev:digest
```

For a first install before a lockfile exists, use `pnpm install`. See
[`CONTRIBUTING.md`](CONTRIBUTING.md) for the full authoring and review flow.

## Guardrails

- Native HTML is the baseline; ARIA is added only for behavior that HTML does not provide.
- Public custom elements use the collision-resistant `nuk-` prefix by default. One registry option
  can instead define the same implementation as `acme-*`, `company-ui-*`, or another validated
  lowercase prefix; public events follow that configured prefix too.
- Theme CSS is optional and separate from component structure.
- Generated component candidates and weekly issues are never promoted automatically.
- CI uses least-privilege permissions; deployment and Terraform remain manual approval gates.
- The workflow rejects suspicious constructs but does **not** claim generated code is safe. Human
  review remains mandatory.

The implementation plan and completion criteria live in
[`docs/implementation-plan.md`](docs/implementation-plan.md). Future research and catalog work is
tracked in [`docs/backlog.md`](docs/backlog.md).
