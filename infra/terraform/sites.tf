module "static_site" {
  for_each = local.sites
  source   = "./modules/static-site"

  site_key                = each.key
  bucket_name             = "${local.name_prefix}-${each.key}-${data.aws_caller_identity.current.account_id}-content"
  domain_name             = each.value.domain_name
  certificate_arn         = aws_acm_certificate.site[each.key].arn
  enable_cloudfront       = var.enable_cloudfront
  force_destroy           = var.force_destroy_buckets
  retain_on_delete        = var.retain_distributions_on_destroy
  log_bucket_id           = aws_s3_bucket.logs.id
  log_bucket_domain_name  = aws_s3_bucket.logs.bucket_domain_name
  asset_path_patterns     = each.value.asset_paths
  error_document_path     = each.value.error_path
  content_security_policy = "default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self' data:; form-action 'self'; frame-ancestors 'self'; frame-src 'self'; img-src 'self' data: https:; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; upgrade-insecure-requests"

  depends_on = [
    aws_s3_bucket_ownership_controls.logs,
    aws_s3_bucket_policy.logs,
  ]
}
