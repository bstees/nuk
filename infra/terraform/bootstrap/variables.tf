variable "aws_region" {
  description = "Region that will contain the Terraform state bucket."
  type        = string
  default     = "us-east-2"
}

variable "state_bucket_name" {
  description = "Globally unique S3 bucket name for Terraform state. Include the AWS account ID."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.state_bucket_name))
    error_message = "state_bucket_name must be a valid 3-63 character S3 bucket name."
  }
}

variable "github_repository" {
  description = "Repository recorded as a state-bucket tag."
  type        = string
}
