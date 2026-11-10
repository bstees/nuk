# @nuk-ui/forge

Forge is a fail-closed, local proof of concept for translating an approved public behavior contract
into a fresh custom-element candidate. It is a provenance and review workflow, not obfuscation, a
code laundering mechanism, a sandbox, or a security guarantee.

The checked-in proof generates `nuk-dismissible-alert` from a normalized JSON specification. The
namespace is part of that specification and may be another valid custom-element prefix; `nuk-` is
the project default.

## Run it

Node 24 and the workspace pnpm version are required.

```sh
pnpm --filter @nuk-ui/forge check
pnpm --filter @nuk-ui/forge proof
```

The proof writes only to `packages/forge/work/proof` and creates:

- a generated TypeScript candidate and deterministic candidate manifest;
- intake, static-analysis, semantic/accessibility conformance, and behavior-parity reports;
- a local CycloneDX 1.6 SBOM;
- JSON and Markdown provenance reports;
- `approval.pending.json`, bound to every promotion input by SHA-256; and
- a summary confirming that automated gates passed and pending promotion was denied.

`proof` never creates an approved record or promotes a candidate. Generated output under `work/` is
a review artifact and is intentionally excluded from linting and source control.

## Workflow contract

| Stage     | Versioned input                                         | Fail-closed result                                                                                |
| --------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Intake    | `policies/v1`, `intake/*.json`                          | Unknown source kinds, licenses, hosts, materials, or declarations are denied.                     |
| Normalize | `schemas/component-spec.v1.schema.json`, `specs/*.json` | Observable behavior, semantics, accessibility, capabilities, and tests are explicit.              |
| Generate  | `prompts/v1`, `skills/v1`, `templates/v1`               | The deterministic generator accepts only its reviewed template contract.                          |
| Analyze   | TypeScript AST rules                                    | Dynamic execution, network/storage access, injection, Node builtins, and undeclared imports fail. |
| Conform   | Spec-derived checks                                     | Native semantics, names, roles, lifecycle cleanup, events, focus, and state behavior must pass.   |
| Parity    | Public behavior cases                                   | The candidate is exercised against normalized outcomes, not reference source structure.           |
| Attest    | Provenance + SBOM                                       | Exact inputs, candidate, reports, source/license notes, and limitations are digest-bound.         |
| Promote   | Human approval record                                   | Pending, rejected, incomplete, automation-authored, stale, or tampered records fail.              |

The schemas are documentation and interchange contracts; executable parsers also validate the
security properties needed by the proof without introducing a runtime schema-library dependency.

## CLI

After `pnpm --filter @nuk-ui/forge build`, `nuk-forge` exposes:

```text
proof [--work-dir PATH]
fixtures
intake --record FILE --policy FILE --out FILE
generate --spec FILE --template FILE --out FILE --manifest FILE
analyze --source FILE [--package FILE] --out FILE
conformance --spec FILE --source FILE --out FILE
approval-request --request-id ID --component-id ID --candidate FILE --spec FILE \
  --analysis FILE --conformance FILE --provenance FILE --out FILE
promote --approval FILE --destination FILE
```

To approve, a human copies the pending record, reviews every bound artifact, changes `status` to
`approved`, supplies their name, ISO review time, a substantive rationale, and this exact
attestation:

> I reviewed the normalized specification, generated source, analysis, conformance, and provenance
> reports.

Promotion rechecks every digest and reruns static, conformance, and behavior gates. A local JSON
name is not strong identity; protected pull-request review or a signed attestation should replace
this local mechanism before accepting externally generated components.

See [the workflow](../../docs/clean-room/workflow.md) and
[threat model](../../docs/security/forge-threat-model.md).
