# Forge threat model

## Security objective

Forge aims to make provenance, capability restrictions, tamper evidence, and human review explicit
for clean-room component candidates. It reduces several known risks. It does not prove originality,
non-infringement, accessibility, behavioral completeness, or security.

## Assets and adversaries

Protected assets are the component source tree, release integrity, user data reachable by a
component, dependency graph, provenance history, and reviewer trust. Inputs may be accidentally
wrong or actively hostile: reference pages can contain prompt injection, a normalized spec can
request unsafe behavior, a template/candidate can contain executable payloads, dependencies can be
undeclared or compromised, reports can be replaced, and an approval record can misrepresent review.

The V1 proof assumes the local operating system, Node runtime, TypeScript compiler, pnpm lockfile,
Forge source, reviewed policy/template, and person operating the approval step are trusted. A
compromise below those boundaries is out of scope.

## Trust boundaries and controls

| Boundary            | Untrusted input                          | V1 control                                                                                                           |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Source intake       | URLs, licenses, documents, factual notes | Default deny, host/kind/license/material allowlists, explicit no-source/no-copy declarations, citations.             |
| Normalization       | Human-authored JSON and text             | Structural parser, namespace binding, required semantics/accessibility/tests, forbidden-capability contract.         |
| Generation          | Spec strings and future model output     | Reviewed deterministic template today; constrained prompts later; no raw source documents; unresolved tokens fail.   |
| Candidate execution | Generated TypeScript                     | Compiler parse, AST capability/dependency checks, semantic checks, then a narrow fake-DOM behavior harness.          |
| Attestation         | Reports, SBOM, provenance                | SHA-256 binds exact candidate and inputs; deterministic output exposes changes.                                      |
| Promotion           | Approval JSON and destination            | Pending by default, named-human fields, exact attestation, digest verification, fresh gate reruns, no override flag. |

### Threats addressed

- Provenance laundering is reduced by a versioned source record, material denylist, citations, and
  the requirement to enumerate facts used.
- Prompt injection is reduced because source notes are data, raw reference pages do not reach the
  deterministic generator, and a future prompt explicitly treats text as untrusted.
- Network/storage exfiltration and hidden persistence are reduced by import/call/property AST rules.
- Script and HTML injection are reduced by rejecting common DOM injection sinks and executable URLs.
- Dynamic execution is reduced by rejecting `eval`, `Function`, dynamic imports/require, string
  timers, workers, VM/process modules, and script creation.
- Dependency confusion is reduced by rejecting bare imports not present in the declared manifest set
  and emitting a local SBOM.
- Artifact substitution and time-of-check/time-of-use changes are reduced by digest-bound approval
  and fresh checks immediately before promotion.
- Accidental automation approval is reduced by a pending-only proof, absence of an approval command,
  and rejection of automation-like reviewer names.

## Known limitations

- Static analysis is pattern-based. Aliasing, computed properties, compiler bugs, Unicode tricks,
  new APIs, or sufficiently novel code can evade a rule. It is not malware analysis or formal
  verification.
- SHA-256 provides tamper evidence, not reviewer identity or non-repudiation. A person with local
  write access can fabricate the textual reviewer fields. Protected pull requests, CODEOWNERS, and
  signed attestations are required for stronger identity.
- The fake-DOM parity harness runs locally after analysis but is not process/container isolation.
  Only reviewed proof templates should be executed there. Unknown external candidates need a
  hardened, network-disabled sandbox before runtime tests.
- A clean-room declaration is only as reliable as the people and processes creating it. Forge cannot
  detect that someone consulted unrecorded source code.
- Public behavior can still be protected or licensed in jurisdiction-specific ways. Source/license
  review remains a human/legal responsibility.
- Static semantic checks do not replace axe, real browser, zoom/reflow, keyboard, screen-reader,
  forced-colors, or reduced-motion review in the component package.
- An SBOM inventories declared versions and manifests; it is not a vulnerability scan, registry
  resolution, signature verification, or proof that installed bytes match a publisher.
- Generated summaries and reports can be wrong. Review the candidate and primary sources, not just
  the pass/fail flag.

## Mandatory human responsibilities

The reviewer verifies source and license declarations, compares behavior with permitted public
documentation, reads every candidate line, checks unexpected capabilities and dependencies,
evaluates native semantics/ARIA/focus behavior, reviews all automated failures and limitations, and
confirms the candidate fits the component authoring policy. The reviewer must reject ambiguity or
request a new versioned spec/policy; there is no exception switch.

After promotion, normal repository ownership, pull-request, browser/accessibility, release,
provenance, and incident-response controls still apply.
