# Supply-chain tooling

`generate-sbom.mjs` creates a deterministic CycloneDX 1.6 JSON inventory from the root and one-level
`apps/*`, `packages/*`, and `tooling/*` package manifests. It performs no network requests and makes
no vulnerability or security claim.

```sh
node tooling/supply-chain/generate-sbom.mjs \
  --root . \
  --output outputs/sbom.cdx.json \
  --timestamp "$SOURCE_DATE_EPOCH"
```

Development dependencies are excluded unless `--include-dev` is passed. Without a timestamp, the
tool uses the Unix epoch so repeated runs are byte-stable. CI should pass a commit timestamp through
`SOURCE_DATE_EPOCH`. Version strings come from package manifests; registry resolution is
deliberately out of scope, so the SBOM must travel with the lockfile for a full dependency review.
