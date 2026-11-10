# Clean-room component translation workflow

Version 1 turns permitted behavior documentation or a first-party request into an original candidate
without using a third-party implementation as generator input. It preserves provenance and review
responsibility; it does not make copied code legitimate, remove license duties, or guarantee
security.

## Invariants

- `nuk-` is the default public custom-element namespace. The normalized spec carries a validated,
  collision-safe prefix so another deployment can intentionally choose a different namespace.
- Reference implementation source, source maps, minified bundles, decompiled output, and third-party
  snippets are denied inputs.
- Source notes contain short factual behavior observations and citations, not copied prose or code.
- Specs describe observable semantics, state, events, accessibility, and acceptance tests. They do
  not encode another library's private structure.
- A generated file is always a candidate. Automation has no approval authority.
- Any unknown policy value, failed check, missing artifact, changed digest, or incomplete approval
  stops promotion.

## 1. Source and license intake

The default-deny policy is `packages/forge/policies/v1/source-policy.json`. Its corresponding schema
and executable parser require:

- an allowed source kind, license expression, URI scheme, and HTTPS host;
- a list of the exact facts used and material kinds consulted;
- explicit declarations that implementation source, source maps, decompiled artifacts, and copied
  code or styles were not used; and
- `excerptsCopied=false` for every source.

V1 allows first-party specifications, public standards/API documentation, and public accessibility
guidance from the reviewed allowlist. It denies by default. Adding a host or license is a policy
change requiring legal/provenance review; it is not a per-run override.

The proof's record cites its first-party brief, WAI-ARIA alert guidance, and MDN's native button
documentation, including their stated license expressions. Those citations support behavioral facts
only. The intake record does not grant rights or make a legal conclusion.

## 2. Normalized specification

`component-spec.v1.schema.json` is the interchange format. The executable parser additionally
enforces the component/namespace relationship, semantic version, non-empty provenance, valid initial
states, unique behavior and test IDs, all four acceptance-test levels, WCAG 2.2 AA target, and the
complete V1 forbidden-capability set.

The proof spec is `packages/forge/specs/nuk-dismissible-alert.v1.json`. Its tests are written from
the public behavior contract: native button activation dismisses once, `reset()` restores
visibility, reconnection does not duplicate listeners, and invalid author markup reports a
configuration error.

## 3. Versioned generation contract

The following artifacts move together as V1:

- `prompts/v1/system.md` and `implementation.md` constrain a future model adapter;
- `skills/v1/clean-room-component.md` records the human/machine procedure; and
- `templates/v1/dismissible-alert.ts.tpl` is the deterministic reviewed proof generator.

The local proof invokes no model and performs no network request. It interpolates only validated
identifiers and digests, rejects unresolved template tokens, and produces byte-identical output for
the same normalized spec and template. A future model-generated candidate must enter at the same
untrusted candidate boundary and pass the identical gates.

## 4. Candidate gates

The TypeScript compiler API parses each candidate. AST rules reject parse errors, bare imports
absent from the declared runtime/peer dependency set, Node builtins, network clients and browser
network APIs, storage/cookie/file-system APIs, `eval`, `Function`, dynamic import/require, string
timers, Workers, `innerHTML`/`outerHTML`/`srcdoc`, document writes, event-handler attributes, script
elements, executable URLs, and `dangerouslySetInnerHTML`.

Semantic/accessibility conformance then checks the V1 component contract: custom-element
registration and collision guard, light DOM, native button validation and naming, permitted roles,
state changes, bubbling/composed event, lifecycle cleanup, reset behavior, absence of synthetic
focus movement, and the declared WCAG target.

Finally, a runtime harness exercises the generated candidate against normalized, externally
observable behaviors. These are parity tests against public behavior, not source similarity. The
harness is useful for deterministic local review but is not a hardened sandbox or a substitute for
browser and assistive technology testing.

Safe and deliberately unsafe intake/source fixtures live under `packages/forge/fixtures`; the tests
prove that V1 accepts the safe cases and rejects network, storage, execution, injection, provenance,
and undeclared-import violations.

## 5. Provenance, SBOM, and human promotion

The proof emits candidate, manifest, intake decision, AST analysis, conformance, behavior, CycloneDX
SBOM, provenance JSON/Markdown, and a pending approval request. SHA-256 bindings connect the exact
files; generation timestamps come from recorded input or an explicit source-date value so results
remain reproducible.

The approval record starts `pending` with no reviewer fields. A human must inspect all artifacts and
record approval, name, ISO timestamp, substantive rationale, and the exact attestation printed in
the Forge README. Promotion rejects automation-like reviewer identities, mismatched hashes, failed
reports, and stale/tampered inputs, then reruns all three candidate gates before writing a promoted
file.

Run the complete local proof:

```sh
pnpm --filter @nuk-ui/forge check
```

No proof artifact is accepted into a component package automatically. The reviewed promoted source
must still enter the ordinary contributor pull request, accessibility/browser suite, ownership
review, and release process.
