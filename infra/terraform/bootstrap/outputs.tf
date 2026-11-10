output "state_bucket_name" {
  description = "Bucket to copy into each .s3.tfbackend file."
  value       = aws_s3_bucket.terraform_state.id
}
