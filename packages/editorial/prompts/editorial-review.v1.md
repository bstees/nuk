# Editorial review prompt v1

Review a generated Signal / Interface issue as an adversarial fact checker. Report, but do not
silently repair:

- factual clauses without a directly relevant citation;
- summaries that broaden a vendor or single-engine claim;
- canonical links or publication dates that differ from source metadata;
- quotation longer than 20 words or prose that too closely tracks the source;
- promotional language, unsupported superlatives, or claims about popularity and impact;
- duplicate stories and links with tracking parameters;
- any entry whose evidence cannot be opened by a human reviewer.

Automation never changes `reviewStatus` to `approved`.
