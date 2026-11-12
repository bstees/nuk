# Security policy

## Reporting

Do not open a public issue for a suspected vulnerability. Send Brent Stees a private report with the
affected package/version, reproduction, impact, and any suggested mitigation. A dedicated security
contact can be added before public release; until then, keep the repository private.

## Supported versions

Before the first stable release, only the latest commit on `main` is supported. After `1.0.0`, the
latest major release receives fixes; older majors are handled case by case and documented in their
release notes.

## Scope and limitations

Static analysis, dependency review, CodeQL, provenance, and an SBOM reduce risk but cannot prove
software safe. Generated code crosses an untrusted boundary and requires human review. Never paste
secrets, private source, or restricted-license implementation code into a generation request.
