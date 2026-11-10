output "content_bucket_arn" {
  description = "ARN of the private content bucket."
  value       = aws_s3_bucket.content.arn
}

output "content_bucket_name" {
  description = "Name of the private content bucket."
  value       = var.bucket_name
}

output "distribution_arn" {
  description = "CloudFront distribution ARN, or null during certificate bootstrap."
  value       = try(aws_cloudfront_distribution.site[0].arn, null)
}

output "distribution_count" {
  description = "Number of CloudFront distributions configured for this site."
  value       = length(aws_cloudfront_distribution.site)
}

output "distribution_domain_name" {
  description = "CloudFront distribution hostname, or null during certificate bootstrap."
  value       = try(aws_cloudfront_distribution.site[0].domain_name, null)
}

output "distribution_id" {
  description = "CloudFront distribution ID, or null during certificate bootstrap."
  value       = try(aws_cloudfront_distribution.site[0].id, null)
}
