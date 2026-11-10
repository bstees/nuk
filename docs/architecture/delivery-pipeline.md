# Delivery pipeline

nuk's pipeline creates evidence and review artifacts. It does not publish npm packages, deploy
sites, apply Terraform, edit DNS, or promote generated editorial content automatically.

| Workflow                  | Trigger                                   | Result                                                                                         | Highest permission                        |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Pull request quality      | Pull request                              | Formatting, lint, types, tests, builds, package checks, Forge proof, offline editorial fixture | `contents: read`                          |
| Browser and accessibility | Relevant pull request/push or manual      | Playwright engine coverage and retained report                                                 | `contents: read`                          |
| Dependency review         | Pull request                              | Vulnerability/license/provenance policy decision                                               | `contents: read`                          |
| CodeQL                    | Pull request, main, schedule, or manual   | Security analysis uploaded to code scanning                                                    | `security-events: write`                  |
| Terraform offline review  | Infrastructure change, main, or manual    | Format, validate, and mocked tests; never plan/apply                                           | `contents: read`                          |
| Main verification         | Main push                                 | Integrated check plus reusable static artifacts                                                | `contents: read`                          |
| Static artifacts          | Main caller or manual                     | Retained Storybook and digest build directories                                                | `contents: read`                          |
| SBOM and provenance       | Main push or manual                       | CycloneDX SBOM, deterministic archives, checksums, in-toto statement                           | `contents: read`                          |
| Release candidate         | Manual                                    | Package tarballs, SBOM, checksums, and non-publishing manifest                                 | `contents: read`                          |
| Weekly digest draft       | Weekly or manual                          | Isolated branch and draft pull request                                                         | `contents: write`, `pull-requests: write` |
| Production candidate gate | Manual boolean plus protected Environment | Rebuilt static candidate and explicit no-deployment manifest                                   | `contents: read`                          |

## Repository settings required

- Protect `main`; require pull requests, current approvals, resolved conversations, and successful
  quality/security checks appropriate to the changed paths.
- Create a `production` GitHub Environment with required reviewers. Do not store long-lived cloud
  keys in it.
- Permit GitHub Actions to create pull requests only if the weekly draft automation is desired. Its
  token is scoped only to repository contents and pull requests for that job.
- Keep Actions restricted to approved actions and reusable workflows. Every third-party `uses:`
  reference in this repository is a full commit SHA.

The weekly job stages only `apps/digest/src/content/issues/generated/*.json`, marks the pull request
as draft, and leaves every issue in `reviewStatus: "draft"`. The editor must review citations and
change the source record to approved in the pull request. Static builds exclude drafts by default.

The production gate is intentionally the last implemented stage. Environment approval authorizes
creation of a candidate artifact, not deployment. Adding OIDC token permission, AWS credential
exchange, uploads, invalidations, Terraform operations, package publication, or release creation is
a separate design and authorization decision.
