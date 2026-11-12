variable "site_key" {
  description = "Stable short name for this site."
  type        = string
}

variable "bucket_name" {
  description = "Globally unique private content-bucket name."
  type        = string
}

variable "domain_name" {
  description = "CloudFront alias and ACM certificate name."
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN from us-east-1. The certificate must be ISSUED before enable_cloudfront is true."
  type        = string
}

variable "enable_cloudfront" {
  description = "Whether to create the OAC, policies, function, and distribution."
  type        = bool
}

variable "force_destroy" {
  description = "Whether Terraform may delete a non-empty content bucket."
  type        = bool
}

variable "retain_on_delete" {
  description = "Whether Terraform should disable and retain the distribution instead of deleting it."
  type        = bool
}

variable "log_bucket_id" {
  description = "S3 bucket ID receiving origin access logs."
  type        = string
}

variable "log_bucket_domain_name" {
  description = "S3 bucket domain receiving CloudFront standard logs."
  type        = string
}

variable "asset_path_patterns" {
  description = "CloudFront path patterns whose hashed assets receive the long-lived cache policy."
  type        = set(string)
}

variable "error_document_path" {
  description = "Origin path returned with a 404 response for missing objects."
  type        = string
}

variable "content_security_policy" {
  description = "CSP attached by CloudFront. Keep compatible with the generated static application."
  type        = string
}
