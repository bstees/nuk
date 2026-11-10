# ADR 0001: Workspace and rendering architecture

- Status: accepted
- Date: 2026-11-01

## Context

The system must work in plain HTML and React, retain native semantics, keep theming optional, and
remain understandable to contributors without a framework-specific runtime.

## Decision

Use pnpm workspaces and standards-based autonomous custom elements prefixed `nuk-` by default. A
single registry factory validates and applies a different consumer prefix without forking behavior.
Interactive elements render or coordinate native controls; display/layout elements enhance semantic
light DOM. React adapters provide typed props and event translation but do not own a second
implementation. Tokens and themes are separate packages. Astro builds the editorial site; Storybook
documents the same packages used by consumers.

## Consequences

- One behavior implementation reduces drift between HTML and React.
- Fresh registration subclasses let multiple prefixes coexist without violating the platform rule
  that one constructor cannot be registered twice.
- Some form-associated components need `ElementInternals` plus a documented fallback.
- Native shadow content must deliberately expose parts and inherit custom properties.
- Consumers can opt out of the theme while retaining usable structure.
- The repository avoids a task-runner dependency until graph size or caching measurements justify
  one.
