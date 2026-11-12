# Delivery pipeline

nuk's pipeline creates evidence and review artifacts. It does not publish npm packages, deploy
sites, apply Terraform, or edit DNS.

| Workflow                  | Trigger                                   | Result                                                               | Highest permission       |
| ------------------------- | ----------------------------------------- | -------------------------------------------------------------------- | ------------------------ |
| Pull request quality      | Pull request                              | Formatting, lint, types, tests, builds, package checks, Forge proof  | `contents: read`         |
| Browser and accessibility | Relevant pull request/push or manual      | Playwright engine coverage and retained report                       | `contents: read`         |
| Dependency review         | Pull request                              | Vulnerability/license/provenance policy decision                     | `contents: read`         |
| CodeQL                    | Pull request, main, schedule, or manual   | Security analysis uploaded to code scanning                          | `security-events: write` |
| Terraform offline review  | Infrastructure change, main, or manual    | Format, validate, and mocked tests; never plan/apply                 | `contents: read`         |
| Main verification         | Main push                                 | Integrated check plus reusable static artifacts                      | `contents: read`         |
| Static artifacts          | Main caller or manual                     | Retained Storybook build directory                                   | `contents: read`         |
| SBOM and provenance       | Main push or manual                       | CycloneDX SBOM, deterministic archives, checksums, in-toto statement | `contents: read`         |
| Release candidate         | Manual                                    | Package tarballs, SBOM, checksums, and non-publishing manifest       | `contents: read`         |
| Production candidate gate | Manual boolean plus protected Environment | Rebuilt static candidate and explicit no-deployment manifest         | `contents: read`         |

## Repository settings required

- Protect `main`; require pull requests, current approvals, resolved conversations, and successful
  quality/security checks appropriate to the changed paths.
- Create a `production` GitHub Environment with required reviewers. Do not store long-lived cloud
  keys in it.
- Keep Actions restricted to approved actions and reusable workflows. Every third-party `uses:`
  reference in this repository is a full commit SHA.

The production gate is intentionally the last implemented stage. Environment approval authorizes
creation of a candidate artifact, not deployment. Adding OIDC token permission, AWS credential
exchange, uploads, invalidations, Terraform operations, package publication, or release creation is
a separate design and authorization decision.
