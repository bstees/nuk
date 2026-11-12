# ADR 0004: Review-only AWS static hosting boundary

- Status: accepted
- Date: 2026-11-02
- Amended: 2026-11-12. The editorial digest moved to brentstees.com, so this design now covers one
  site (the Storybook documentation): one content bucket, one certificate and one distribution. The
  text below is the original two-site decision.

## Context

nuk has two independently buildable static surfaces: component documentation and an editorial
digest. They have different release cadences, cache paths, error pages, and future rollback needs.
The domain may remain registered and hosted in GoDaddy DNS. Infrastructure must be reviewable now
without creating services, requiring credentials, or granting a CI system broad cloud access.

## Decision

Describe, but do not apply, an AWS architecture with a private S3 origin and CloudFront distribution
for each site. Use CloudFront Origin Access Control, DNS-validated ACM certificates in `us-east-1`,
a shared protected access-log bucket, response-header and cache policies, and optional tagged-cost
and 5xx alerts. Retain GoDaddy as registrar and authoritative DNS provider.

Use separate staging and production state keys and environment-qualified names. A two-phase switch
keeps CloudFront disabled until a human has added the ACM validation CNAMEs at GoDaddy and both
certificates are issued. Terraform intentionally manages no GoDaddy records.

Define a future deployment role through GitHub OIDC. Its trust policy matches one repository and one
protected GitHub Environment exactly. Its permissions stop at the two content buckets and the two
distribution invalidations; it cannot apply Terraform.

## Consequences

- Each site can change cache, CSP, domain, content, and rollback timing without coupling to the
  other distribution.
- Two distributions and three buckets cost more than a single origin but preserve useful failure and
  permission boundaries. Price Class 100 and no runtime services keep the design conservative.
- External DNS makes certificate setup deliberately multi-step. Removing ACM validation CNAMEs can
  prevent renewal, so they must remain after issuance.
- The legacy CloudFront standard-log destination must retain ACL capability; content origins still
  enforce bucket-owner-only objects.
- Repository workflows can validate syntax and mocked invariants without AWS access. Any future
  plan, apply, DNS edit, content upload, or invalidation requires new, explicit authorization.

Alternatives such as a single distribution, GitHub Pages, and a runtime application platform were
not chosen because they either couple release/security boundaries or add capabilities the static
sites do not need.
