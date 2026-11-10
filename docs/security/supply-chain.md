# Local SBOM and supply-chain notes

`tooling/supply-chain/generate-sbom.mjs` creates a deterministic CycloneDX 1.6 inventory from the
root package plus one-level `apps/*`, `packages/*`, and `tooling/*` package manifests. It makes no
network requests. Workspace and external declared dependency edges are sorted, package manifests are
hashed, and the serial number is deterministically derived from the graph.

```sh
SOURCE_DATE_EPOCH="$(git show -s --format=%ct HEAD)" \
  node tooling/supply-chain/generate-sbom.mjs --root . --output outputs/sbom.cdx.json
```

The default timestamp is the Unix epoch for byte reproducibility. Development dependencies require
`--include-dev`. CI/release inventories should use the commit timestamp and should retain the pnpm
lockfile beside the SBOM because external versions are recorded from manifest declarations without
registry resolution.

The tool is an inventory generator only. Dependency review, lockfile integrity policy, provenance
signing, vulnerability scanning, action pin updates, and release attestation remain separate
controls.
