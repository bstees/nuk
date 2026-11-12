# Review-only AWS static hosting

This directory describes a private S3 origin and CloudFront distribution for the Storybook
documentation site. It also describes a DNS-validated ACM certificate, central access logs,
conservative caching, security headers, cost/error notifications, and a GitHub OIDC role restricted
to one repository Environment.

Nothing in this repository applies this configuration. The checked-in GitHub workflows format,
initialize with the backend disabled, validate, and run mocked tests only. A human must review an
AWS plan, expected costs, DNS changes, and the production Environment protection before any future
apply.

## Local checks (no AWS account required)

```sh
terraform fmt -check -recursive infra/terraform
terraform -chdir=infra/terraform init -backend=false
terraform -chdir=infra/terraform validate
terraform -chdir=infra/terraform test
terraform -chdir=infra/terraform/bootstrap init -backend=false
terraform -chdir=infra/terraform/bootstrap validate
```

`init` downloads the pinned provider from the Terraform Registry; it does not call AWS. Do not run
`plan` without intentionally selecting an AWS account and environment.

## State bootstrap

The backend cannot safely create the bucket that stores its own state. An authorized operator must
therefore review and run `bootstrap/` once with local state, using a globally unique bucket name
that includes the AWS account ID. The bucket blocks public access, enforces TLS, enables encryption
and versioning, and has `prevent_destroy` set.

After that separately approved operation:

1. Copy the matching file from `backend/*.s3.tfbackend.example` to an ignored file without the
   `.example` suffix.
2. Replace its bucket placeholder with the bootstrap output.
3. Initialize with `terraform init -backend-config=backend/<environment>.s3.tfbackend`.
4. Confirm that staging and production use different state keys. Separate AWS accounts are
   preferred; if one account is used, the state keys and resource names remain separate.

Terraform 1.10 native S3 lockfiles are used instead of a DynamoDB table. State and backend files may
contain sensitive infrastructure metadata; never commit live backend files, plans, or state.

## Deliberate two-phase certificate flow

`enable_cloudfront` defaults to `false`. A future, approved phase-one apply creates the buckets and
ACM requests but no public distribution. Copy the `acm_dns_validation_records` output into GoDaddy
DNS and wait until the certificate shows `ISSUED`. A second reviewed plan may then set
`enable_cloudfront = true` and create the distribution. Finally, point the public subdomain at the
`cloudfront` output name.

This sequencing avoids asking CloudFront to attach a pending certificate. The repository does not
create `aws_acm_certificate_validation` because GoDaddy remains authoritative and Terraform cannot
prove those external records exist.

## Security and cost choices

- Origins are private, encrypted, versioned, and reachable only through Origin Access Control.
- The distribution redirects HTTP to HTTPS and requires TLS 1.2 or newer at the viewer boundary.
- A response-header policy supplies CSP, HSTS, clickjacking, MIME-sniffing, referrer, and
  permissions controls. Re-test the CSP against every static build before deployment.
- Documents cache briefly; generated asset paths cache for one year. Upload tooling must give only
  content-addressed files the long-lived policy.
- S3 and CloudFront access logs expire after 90 days by default. CloudFront's legacy standard log
  delivery requires ACL capability on the dedicated log bucket; content buckets still enforce
  bucket-owner-only objects.
- Price Class 100 limits edge locations. No WAF, Lambda, databases, or runtime compute are created.
- Setting `alert_email` adds a tagged-cost budget, an SNS subscription, and CloudFront 5xx alarms.
  The recipient must confirm SNS. Cost-allocation tags must be activated in AWS Billing before the
  tag-filtered budget can report completely.
- Buckets refuse destruction while non-empty, and distributions are retained on destroy by default.

## OIDC boundary

The role trusts only `repo:OWNER/REPOSITORY:environment:ENVIRONMENT`, not a branch wildcard. Its
inline policy can list the content bucket, manage objects within it, and (after the distribution
exists) invalidate only that distribution. It cannot change infrastructure, certificates, logs, IAM,
or DNS. The GitHub Environment must have required reviewers.

The GitHub OIDC provider is account-wide. If one already exists, set
`create_github_oidc_provider = false` and provide its ARN. Re-verify the checked-in certificate
thumbprints against current GitHub and AWS documentation immediately before any apply.

See `docs/architecture/cloud-hosting-and-dns.md` for the GoDaddy boundary and operational sequence.
