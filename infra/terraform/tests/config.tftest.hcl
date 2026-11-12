mock_provider "aws" {
  mock_data "aws_caller_identity" {
    defaults = {
      account_id = "123456789012"
      arn        = "arn:aws:iam::123456789012:user/terraform-test"
      user_id    = "AIDATEST"
    }
  }

  mock_resource "aws_cloudfront_distribution" {
    defaults = {
      arn         = "arn:aws:cloudfront::123456789012:distribution/EDUMMY"
      domain_name = "dummy.cloudfront.net"
      id          = "EDUMMY"
    }
  }
}

mock_provider "aws" {
  alias = "us_east_1"
}

run "secure_bootstrap_phase" {
  command = plan

  variables {
    environment       = "production"
    docs_domain_name  = "components.example.com"
    github_repository = "owner/repository"
  }

  assert {
    condition     = !output.cloudfront["docs"].enabled
    error_message = "CloudFront must remain disabled during the default certificate bootstrap phase."
  }

  assert {
    condition     = output.github_oidc_subject == "repo:owner/repository:environment:production"
    error_message = "The OIDC trust subject must be scoped to the configured GitHub Environment."
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.logs.block_public_acls && aws_s3_bucket_public_access_block.logs.restrict_public_buckets
    error_message = "The central access-log bucket must block public access."
  }
}

run "distribution_phase" {
  command = plan

  variables {
    environment       = "production"
    docs_domain_name  = "components.example.com"
    enable_cloudfront = true
    github_repository = "owner/repository"
  }

  assert {
    condition     = output.cloudfront["docs"].enabled
    error_message = "Enabling CloudFront must plan a distribution for the documentation site."
  }
}
