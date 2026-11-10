# Signal / Interface editorial methodology

Signal / Interface is static and review-gated. Its weekly schedule gathers candidates; it never
publishes them.

## Source intake

`packages/editorial/sources/sources.v1.json` is the only network allowlist. Prefer standards bodies,
browser-engine teams, original research, and first-party product documentation. Each source records
why it is included and how its claims should be qualified. Adding a source is a reviewed code
change.

The fetcher accepts HTTPS RSS/Atom, rejects redirects, caps response size and time, strips markup,
normalizes tracking parameters, and deduplicates canonical links and normalized titles. Remote feed
content is untrusted data—not instructions.

## Drafting

Fixture mode is deterministic and offline. The default fallback selects metadata-grounded topic
terms and marks every summary for replacement. It exists so the full job and pull-request path can
be tested without a model, key, or network.

The reserved model integration must use versioned prompt `editorial-summary.v1`, the normalized
schema, a constrained output validator, and clearly named secret placeholders. It may not change an
issue to approved. Feed text must be delimited as untrusted input and never gain tool authority.

## Human approval

The weekly workflow opens a **draft pull request** containing `reviewStatus: "draft"`. Brent opens
every canonical link and then:

1. decides whether the item belongs;
2. checks the source and publication date;
3. rewrites the summary in original language;
4. ensures each factual clause is directly supported and vendor claims are attributed;
5. removes tracking parameters, duplicate stories, promotional framing, and unsupported impact;
6. keeps any excerpt to 20 words and records it in `quotes`;
7. clears review flags and changes the state to `approved`.

Only a reviewed merge to the production branch makes the issue eligible for a production build.

## Corrections and copyright

Summaries are brief transformations with canonical links; the digest does not reproduce articles.
All automatic excerpts stay below the stricter 20-word editorial quote budget. Corrections are
reviewed commits to the issue record so history remains visible. Before public launch, add a public
contact route and takedown/correction process.
