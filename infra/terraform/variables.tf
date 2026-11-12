variable "project_name" {
  description = "Short, bucket-safe project identifier used in names and cost-allocation tags."
  type        = string
  default     = "nuk-components"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,19}$", var.project_name))
    error_message = "project_name must be 3-20 lowercase alphanumeric or hyphen characters and start with a letter."
  }
}

variable "environment" {
  description = "Isolated environment name. Use a separate backend key, and preferably a separate AWS account, for each value."
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be either staging or production."
  }
}

variable "aws_region" {
  description = "Region for S3 origins and the access-log bucket. CloudFront certificates remain in us-east-1."
  type        = string
  default     = "us-east-2"

  validation {
    condition     = can(regex("^[a-z]{2}(-gov)?-[a-z]+-[0-9]+$", var.aws_region))
    error_message = "aws_region must be a valid AWS region identifier."
  }
}

variable "docs_domain_name" {
  description = "Fully qualified subdomain for the Storybook documentation site."
  type        = string

  validation {
    condition     = length(var.docs_domain_name) <= 253 && can(regex("^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$", var.docs_domain_name))
    error_message = "docs_domain_name must be a lowercase fully qualified DNS name such as components.example.com."
  }
}

variable "enable_cloudfront" {
  description = "Create the distribution only after the ACM certificate is ISSUED. Keep false for the certificate/DNS bootstrap phase."
  type        = bool
  default     = false
}

variable "force_destroy_buckets" {
  description = "Permit Terraform to delete non-empty content and log buckets. Keep false outside an explicitly approved teardown."
  type        = bool
  default     = false
}

variable "retain_distributions_on_destroy" {
  description = "Disable and retain CloudFront distributions instead of deleting them during a Terraform destroy."
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Days to retain S3 and CloudFront access logs."
  type        = number
  default     = 90

  validation {
    condition     = var.log_retention_days >= 30 && var.log_retention_days <= 3650
    error_message = "log_retention_days must be between 30 and 3650."
  }
}

variable "alert_email" {
  description = "Optional address for budget and CloudFront 5xx notifications. SNS requires recipient confirmation."
  type        = string
  default     = null
  nullable    = true

  validation {
    condition     = var.alert_email == null || can(regex("^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$", var.alert_email))
    error_message = "alert_email must be null or a plausible email address."
  }
}

variable "monthly_budget_usd" {
  description = "Monthly tagged-cost budget in USD. It is created only when alert_email is set."
  type        = number
  default     = 15

  validation {
    condition     = var.monthly_budget_usd >= 1 && var.monthly_budget_usd <= 10000
    error_message = "monthly_budget_usd must be between 1 and 10000."
  }
}

variable "github_repository" {
  description = "GitHub repository in owner/name form allowed to assume the future deployment role."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "github_repository must use owner/name form."
  }
}

variable "github_environment" {
  description = "GitHub Environment encoded into the OIDC trust subject. Configure required reviewers there."
  type        = string
  default     = "production"

  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]{1,64}$", var.github_environment))
    error_message = "github_environment contains unsupported characters."
  }
}

variable "create_github_oidc_provider" {
  description = "Create the account-wide GitHub OIDC provider. Set false when the account already has one and supply its ARN."
  type        = bool
  default     = true
}

variable "github_oidc_provider_arn" {
  description = "Existing GitHub OIDC provider ARN when create_github_oidc_provider is false."
  type        = string
  default     = null
  nullable    = true

  validation {
    condition     = var.github_oidc_provider_arn == null || can(regex("^arn:(aws|aws-us-gov):iam::[0-9]{12}:oidc-provider/token\\.actions\\.githubusercontent\\.com$", var.github_oidc_provider_arn))
    error_message = "github_oidc_provider_arn must be the ARN of the token.actions.githubusercontent.com provider."
  }
}

variable "github_oidc_thumbprints" {
  description = "SHA-1 thumbprints for GitHub's OIDC provider. Re-verify against GitHub and AWS documentation before an apply."
  type        = list(string)
  default = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1b511abead59c6ce207077c0bf0e0043b1382612",
  ]

  validation {
    condition     = length(var.github_oidc_thumbprints) > 0 && alltrue([for value in var.github_oidc_thumbprints : can(regex("^[0-9a-f]{40}$", value))])
    error_message = "github_oidc_thumbprints must contain one or more lowercase 40-character SHA-1 values."
  }
}
