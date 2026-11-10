# Clean-room component translation procedure v1

This is a versioned workflow artifact, not an installed Codex skill.

1. Record every consulted source, rights basis, material type, and fact used in an intake record.
2. Apply the v1 source policy. Stop on an unknown license, host, source kind, denied material, or
   false clean-room declaration.
3. Convert allowed facts into the v1 normalized spec. Keep behavior statements observable and attach
   an acceptance test to every important state or event.
4. Generate from the normalized spec with the pinned v1 prompt and template. Never pass source pages
   or implementation artifacts to a generator.
5. Run syntax, dependency, capability, semantic, accessibility, conformance, and behavioral checks.
6. Produce provenance and CycloneDX SBOM records whose digests bind the exact candidate and inputs.
7. Create a pending approval request. A named human reviews the candidate and reports, records an
   approval or rejection, and is responsible for license and product judgment.
8. Promote only when every bound digest matches and the record contains the exact approval
   attestation.

Fail closed. An exception requires a new reviewed policy or spec version; it is not a command-line
override.
