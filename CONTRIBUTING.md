# Contributing

Thank you for helping improve the system. Keep each change small enough to review and include the
behavioral, accessibility, and documentation evidence needed to understand it.

## Local workflow

1. Use Node 24 and pnpm 11.
2. Run `pnpm install --frozen-lockfile`.
3. Create or update a Changeset for any publishable package API change: `pnpm changeset`.
4. Run `pnpm check` and, for interactive behavior, `pnpm test:browser`.
5. Inspect both light and dark modes at narrow and wide **container** widths.
6. Complete the checklist in `docs/accessibility-checklist.md`.

Commits must not contain credentials, generated build directories, copied implementation source, or
unreviewed generated components/issues. Dependency additions require a purpose, compatible license,
pinned lockfile resolution, and an updated third-party notice when attribution is needed.

## Component changes

- Begin with the native semantic element and document why a custom interaction is necessary.
- Keep component structure in `@nuk-ui/elements`; keep presentation in `@nuk-ui/theme`.
- Prefix every public custom element with `nuk-`.
- Prefer logical properties, intrinsic layout, and container queries over viewport breakpoints.
- Add keyboard, focus, forced-colors, reduced-motion, zoom/reflow, and accessible-name coverage.
- React adapters must not silently diverge from the custom-element attributes, properties, or
  events.

## Generated work

Forge output stays a candidate until a human changes its approval record and runs the explicit
promotion command. Editorial output stays a draft pull request until Brent edits or approves it.
Passing automation is evidence for review, not a substitute for review.

Please report security concerns privately as described in `SECURITY.md`.
