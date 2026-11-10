# ADR 0003: Configurable custom-element prefixes

- Status: accepted
- Date: 2026-11-02

## Context

`nuk-` is memorable and collision-resistant enough for the default distribution, but a company may
need a house namespace or the project may rename later. Hard-coded tag selectors, event names, and
radio-group queries would make that choice a fork rather than configuration. The Custom Elements
specification also forbids registering one constructor under two names in a registry.

## Decision

`@nuk-ui/elements` exports `defineElements({ prefix, registry })`. It accepts `nuk`, `nuk-`,
`acme-ui`, or `acme-ui-`, normalizes the trailing hyphen, rejects invalid/reserved names, and
returns the exact tag map and event-name helper. The default remains `nuk-`.

Each registration uses a fresh subclass carrying immutable prefix/component metadata. Shared base
behavior derives public events from that metadata, so `acme-checkbox` emits `acme-change`. Internal
queries use the host's registered tag rather than a literal name. A collision with an unrelated
constructor fails loudly; repeating the same nuk registration is idempotent.

CSS custom properties remain `--nuk-*`. They are stable theme API, not element names. Generating
token names at runtime would make styles order-dependent and complicate static CSS, CSP, caching,
and design-tool exports. A company theme can alias or assign the semantic variables.

## Consequences

- Renaming tags or using a corporate namespace does not fork component logic.
- Public event listeners must use the registration result or the configured prefix.
- Declarative HTML must load the matching registration before relying on upgraded behavior.
- One page may register two prefixes, but doing so is discouraged unless integrating independently
  named surfaces; it increases bundle/API surface without adding behavior.
- Static global host fallbacks need `createStructuralStyles(prefix)` for a non-default prefix.
