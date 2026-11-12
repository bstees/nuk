locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = var.project_name
    Repository  = var.github_repository
  }

  sites = {
    docs = {
      domain_name = var.docs_domain_name
      error_path  = "/index.html"
      asset_paths = ["/assets/*", "/sb-addons/*"]
    }
  }
}
