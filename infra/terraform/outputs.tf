output "acm_dns_validation_records" {
  description = "CNAME records to add at the authoritative DNS provider. Values appear after the certificate bootstrap apply."
  value = {
    for site, certificate in aws_acm_certificate.site : site => [
      for option in certificate.domain_validation_options : {
        name  = option.resource_record_name
        type  = option.resource_record_type
        value = option.resource_record_value
      }
    ]
  }
}

output "content_buckets" {
  description = "Private origin bucket names keyed by site."
  value       = { for site, resources in module.static_site : site => resources.content_bucket_name }
}

output "cloudfront" {
  description = "Per-site distribution status; identifiers and DNS targets remain null until CloudFront is enabled."
  value = {
    for site, resources in module.static_site : site => {
      alias       = local.sites[site].domain_name
      domain_name = resources.distribution_domain_name
      enabled     = resources.distribution_count == 1
      id          = resources.distribution_id
    }
  }
}

output "deployment_role_arn" {
  description = "Least-privilege OIDC role for a future, separately approved static upload workflow."
  value       = aws_iam_role.github_deployment.arn
}

output "log_bucket_name" {
  description = "Protected bucket receiving S3 and CloudFront access logs."
  value       = aws_s3_bucket.logs.id
}

output "github_oidc_subject" {
  description = "Exact GitHub OIDC subject trusted by the deployment role."
  value       = local.github_oidc_subject
}
