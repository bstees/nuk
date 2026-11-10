# Cloud hosting and GoDaddy DNS boundary

The checked-in Terraform is an architecture proposal, not a deployed environment. Repository CI
never runs `terraform plan` or `terraform apply`, never requests AWS credentials, and never changes
DNS. The design can be reviewed and tested locally with mocked providers.

## Resource boundary

| Owner          | Responsibility                                                                                        | Explicitly outside its boundary                             |
| -------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| GoDaddy        | Domain registration, authoritative nameservers, ACM validation CNAMEs, and public site CNAMEs         | Content, TLS private keys, caching, headers, and AWS access |
| AWS ACM        | Request and renew public certificates after DNS validation                                            | Creating or repairing GoDaddy records                       |
| AWS S3         | Private, encrypted, versioned Storybook and digest origins plus access-log storage                    | Public website endpoints and TLS termination                |
| AWS CloudFront | HTTPS, aliases, origin signing, clean-URL rewriting, cache behavior, security headers, and edge logs  | Editorial approval and source builds                        |
| GitHub         | Source review, static build artifacts, draft editorial PRs, and a protected production candidate gate | Automatic deployment or infrastructure mutation             |

The Storybook and digest have separate origin buckets, certificates, and distributions. They share
only the access-log bucket and the narrowly scoped future OIDC role. The distribution never grants
anonymous S3 access; Origin Access Control signs reads and the bucket policy binds those reads to
the exact distribution ARN.

## Future activation sequence

This sequence is guidance for a separately authorized change. It has not been performed.

1. Decide the real AWS account(s), subdomains, alert recipient, monthly budget, and log retention.
   Subdomains such as `components.example.com` and `digest.example.com` avoid apex-DNS limitations.
2. Review and bootstrap the protected S3 state bucket. Keep staging and production in separate state
   keys and preferably separate accounts.
3. Review a phase-one plan with `enable_cloudfront = false`. It should contain private content and
   log buckets, ACM requests, alerting if configured, and the OIDC role—but no distribution.
4. After an authorized phase-one apply, copy each `acm_dns_validation_records` CNAME exactly into
   the GoDaddy zone. Some DNS consoles automatically append the zone name; confirm the resulting
   fully qualified record rather than guessing. Leave validation records in place for renewal.
5. Wait for both ACM certificates to report `ISSUED`. Review a second plan with
   `enable_cloudfront = true`, including policies, functions, and two distributions.
6. Before any upload, inspect the static builds, their CSP console output, cache headers, checksums,
   accessibility report, SBOM, and rollback package. Upload tooling must distinguish short-lived
   HTML from content-addressed assets.
7. Add GoDaddy CNAMEs from each public subdomain to the matching CloudFront domain output. Do not
   interchange documentation and digest targets. Verify HTTPS and headers before reducing TTLs.

If an apex domain is later required, GoDaddy must provide a documented apex-alias capability or the
DNS zone must be deliberately delegated to a provider that does. Terraform must not silently move
nameservers or create a Route 53 hosted zone.

## Environments, state, and credentials

Backend examples use `nuk/staging/terraform.tfstate` and `nuk/production/terraform.tfstate` with
Terraform's native S3 lockfile. Live backend files, plans, state, account IDs, and email addresses
are local/CI configuration and must not be committed.

The future upload role trusts the GitHub OIDC subject
`repo:OWNER/REPOSITORY:environment:ENVIRONMENT`. A repository branch alone cannot assume it. The
GitHub Environment must require human reviewers, and a future upload workflow should request
`id-token: write` only on its environment-gated deployment job. The current candidate workflow
deliberately has no such permission and no AWS action.

Infrastructure administration is a different trust boundary. The upload role cannot alter S3
configuration, IAM, ACM, CloudFront configuration, budgets, logging, or Terraform state. Any future
infrastructure role should be designed and reviewed separately rather than expanding the uploader.

## Recovery and operations

Content buckets retain versions for 30 days and distributions are retained on destroy by default. A
recovery runbook should identify a known-good object version or candidate artifact, restore it,
verify checksums, and invalidate only affected paths. Do not use `force_destroy_buckets = true` as a
routine cleanup mechanism.

CloudFront 5xx alarms and the budget exist only when `alert_email` is configured; the SNS recipient
must confirm the subscription. Billing tag filters are incomplete until the account activates the
`Project` cost-allocation tag. Budgets and alarms are detection, not spending caps or uptime
guarantees.
