# Editorial pipeline

This package converts allow-listed RSS/Atom records into a deterministic **draft** issue. Network
access is off by default. `pnpm generate:fixture` uses only repository-authored XML and requires no
credentials. Scheduled intake must set `ALLOW_DIGEST_NETWORK=1` explicitly.

The deterministic fallback produces metadata-grounded placeholder summaries and flags every entry
for human rewriting. A future model integration may use `DIGEST_MODEL_API_KEY` and
`DIGEST_MODEL_ENDPOINT`, but neither exists in v1 and no default command reads them. Prompt
versions, source-manifest version, canonical URLs, dates, citations, quotes, and review flags travel
with each issue.

Automation cannot approve an issue. Production validation accepts only `reviewStatus: "approved"`
with no unresolved flags. See `docs/guides/editorial-methodology.md` for the human review contract.
