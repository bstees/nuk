resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = var.github_oidc_thumbprints

  tags = {
    Purpose = "GitHubActionsOIDC"
  }
}

locals {
  github_oidc_provider_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : coalesce(var.github_oidc_provider_arn, "arn:aws:iam::000000000000:oidc-provider/token.actions.githubusercontent.com")
  github_oidc_subject      = "repo:${var.github_repository}:environment:${var.github_environment}"
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    sid     = "GitHubEnvironmentOnly"
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [local.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [local.github_oidc_subject]
    }
  }
}

resource "aws_iam_role" "github_deployment" {
  name                 = "${local.name_prefix}-github-deploy"
  description          = "Future static-site upload role; assumption requires the reviewed GitHub Environment"
  assume_role_policy   = data.aws_iam_policy_document.github_assume_role.json
  max_session_duration = 3600

  lifecycle {
    precondition {
      condition     = var.create_github_oidc_provider || var.github_oidc_provider_arn != null
      error_message = "github_oidc_provider_arn is required when create_github_oidc_provider is false."
    }
  }
}

data "aws_iam_policy_document" "github_deployment" {
  statement {
    sid    = "ListOnlySiteBuckets"
    effect = "Allow"
    actions = [
      "s3:GetBucketLocation",
      "s3:ListBucket",
    ]
    resources = [for site in module.static_site : site.content_bucket_arn]
  }

  statement {
    sid    = "ManageOnlySiteObjects"
    effect = "Allow"
    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject",
    ]
    resources = [for site in module.static_site : "${site.content_bucket_arn}/*"]
  }

  dynamic "statement" {
    for_each = var.enable_cloudfront ? [1] : []

    content {
      sid       = "InvalidateOnlySiteDistributions"
      effect    = "Allow"
      actions   = ["cloudfront:CreateInvalidation"]
      resources = [for site in module.static_site : site.distribution_arn]
    }
  }
}

resource "aws_iam_role_policy" "github_deployment" {
  name   = "static-site-content-only"
  role   = aws_iam_role.github_deployment.id
  policy = data.aws_iam_policy_document.github_deployment.json
}
