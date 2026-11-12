# ADR 0002: Static editorial site and review gate

- Status: superseded on 2026-11-12. The digest moved to the brentstees.com repository, and
  `apps/digest`, `packages/editorial` and the weekly draft workflow were removed from nuk. This
  record is kept for history.
- Date: 2026-11-01

## Context

The digest needs weekly input gathering, citations, archives, feeds, and previews without runtime
credentials, a database, automatic publishing, or generated-content churn.

## Decision

Use Astro static generation over versioned issue JSON. A Node package reads a small RSS/Atom
allowlist, normalizes records, and creates deterministic drafts. Scheduled automation opens a draft
pull request. Production builds include approved records only; clearing flags and changing the
review state are human actions.

## Consequences

The complete pipeline works offline with fixtures, hosting is inexpensive and cacheable, and issue
history is reviewable in Git. Feed changes can still break network intake, summaries still require
fact checking, and a correction requires a new reviewed commit/build.
