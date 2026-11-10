# Release and versioning policy

Public `@nuk-ui/*` packages use Semantic Versioning and Changesets. The initial catalog is `0.x`:
minor releases may intentionally refine public APIs, while patches are backward-compatible fixes.
Every user-visible API, behavior, token, CSS part, event, accessibility contract, or browser-support
change needs a changeset or a review explanation for why no package version changes.

Packages are independently versioned by Changesets. Internal dependency ranges move by at least a
patch when a depended-on package changes. The release-candidate workflow packs all public packages
together so reviewers can catch cross-package incompatibility even when only one package is due for
a release.

## Change classification

- **Patch:** backward-compatible bug, accessibility correction that does not remove a supported API,
  documentation-only package correction, or internal implementation change.
- **Minor in 0.x:** additive component/API/token behavior or a deliberate pre-1.0 breaking change.
  The changeset must say what changed and how to migrate.
- **Major after 1.0:** removed/renamed public API, incompatible DOM/event/keyboard behavior, changed
  styling contract, or reduced browser/accessibility support.

Security fixes do not bypass compatibility analysis. If a safe fix must break behavior, describe the
risk, migration, and affected versions explicitly rather than labeling it a patch.

## Candidate and release gate

The manual release workflow checks out an explicit ref, builds and verifies packages, creates npm
tarballs, generates an SBOM and checksums, and uploads a non-publishing candidate artifact. Review:

1. changesets and generated versions/changelogs;
2. tarball contents, exports, types, license, README, and dependency ranges;
3. unit, browser, accessibility, and package-verification evidence;
4. SBOM changes, dependency licenses, checksums, and provenance limitations;
5. plain HTML and React upgrade examples.

The workflow does not run `npm publish`, create a GitHub Release, push tags, or deploy either site.
A future publishing workflow needs a protected Environment, trusted publishing/OIDC where the
registry supports it, two-person review, exact expected package versions, and a dry-run comparison
against these candidate tarballs. Long-lived registry tokens are not an acceptable default.

Use immutable package-version tags only after the registry confirms publication. Moving tags such as
`latest` are channel pointers, not provenance. Deprecation should name a supported replacement and a
removal window; never silently republish an existing version.
