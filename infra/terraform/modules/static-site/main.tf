resource "aws_s3_bucket" "content" {
  bucket        = var.bucket_name
  force_destroy = var.force_destroy

  tags = {
    Site = var.site_key
  }
}

resource "aws_s3_bucket_ownership_controls" "content" {
  bucket = aws_s3_bucket.content.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_public_access_block" "content" {
  bucket = aws_s3_bucket.content.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "content" {
  bucket = aws_s3_bucket.content.id

  rule {
    bucket_key_enabled = false

    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "content" {
  bucket = aws_s3_bucket.content.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "content" {
  bucket = aws_s3_bucket.content.id

  rule {
    id     = "remove-old-object-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_logging" "content" {
  bucket        = aws_s3_bucket.content.id
  target_bucket = var.log_bucket_id
  target_prefix = "s3/${var.site_key}/"
}

resource "aws_cloudfront_origin_access_control" "content" {
  count = var.enable_cloudfront ? 1 : 0

  name                              = "${var.bucket_name}-oac"
  description                       = "Signed CloudFront access to the private ${var.site_key} origin"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_cache_policy" "html" {
  count = var.enable_cloudfront ? 1 : 0

  name        = "${var.bucket_name}-html"
  comment     = "Short cache for documents and route responses"
  default_ttl = 300
  max_ttl     = 86400
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_cache_policy" "assets" {
  count = var.enable_cloudfront ? 1 : 0

  name        = "${var.bucket_name}-assets"
  comment     = "Long cache for content-addressed static assets"
  default_ttl = 31536000
  max_ttl     = 31536000
  min_ttl     = 86400

  parameters_in_cache_key_and_forwarded_to_origin {
    enable_accept_encoding_brotli = true
    enable_accept_encoding_gzip   = true

    cookies_config {
      cookie_behavior = "none"
    }

    headers_config {
      header_behavior = "none"
    }

    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_response_headers_policy" "security" {
  count = var.enable_cloudfront ? 1 : 0

  name    = "${var.bucket_name}-security"
  comment = "Security and browser-isolation headers for ${var.site_key}"

  security_headers_config {
    content_security_policy {
      content_security_policy = var.content_security_policy
      override                = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "SAMEORIGIN"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = false
      override                   = true
      preload                    = false
    }

    xss_protection {
      mode_block = true
      override   = true
      protection = true
    }
  }

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      override = true
      value    = "accelerometer=(), camera=(), geolocation=(), gyroscope=(), microphone=(), payment=(), usb=()"
    }

    items {
      header   = "X-Permitted-Cross-Domain-Policies"
      override = true
      value    = "none"
    }
  }
}

resource "aws_cloudfront_function" "clean_urls" {
  count = var.enable_cloudfront ? 1 : 0

  name    = "${replace(var.bucket_name, "-", "_")}_clean_urls"
  runtime = "cloudfront-js-2.0"
  comment = "Resolve directory and extensionless routes to generated index documents"
  publish = true
  code    = <<-JAVASCRIPT
    function handler(event) {
      var request = event.request;
      var uri = request.uri;
      if (uri.charAt(uri.length - 1) === "/") {
        request.uri = uri + "index.html";
      } else if (uri.lastIndexOf(".") < uri.lastIndexOf("/")) {
        request.uri = uri + "/index.html";
      }
      return request;
    }
  JAVASCRIPT
}

resource "aws_cloudfront_distribution" "site" {
  count = var.enable_cloudfront ? 1 : 0

  aliases             = [var.domain_name]
  comment             = "${var.site_key} static site"
  default_root_object = "index.html"
  enabled             = true
  http_version        = "http2and3"
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  retain_on_delete    = var.retain_on_delete
  wait_for_deployment = true

  origin {
    domain_name              = aws_s3_bucket.content.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.content[0].id
    origin_id                = "s3-${var.site_key}"
  }

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cache_policy_id            = aws_cloudfront_cache_policy.html[0].id
    cached_methods             = ["GET", "HEAD", "OPTIONS"]
    compress                   = true
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security[0].id
    target_origin_id           = "s3-${var.site_key}"
    viewer_protocol_policy     = "redirect-to-https"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.clean_urls[0].arn
    }
  }

  dynamic "ordered_cache_behavior" {
    for_each = var.asset_path_patterns

    content {
      allowed_methods            = ["GET", "HEAD", "OPTIONS"]
      cache_policy_id            = aws_cloudfront_cache_policy.assets[0].id
      cached_methods             = ["GET", "HEAD", "OPTIONS"]
      compress                   = true
      path_pattern               = ordered_cache_behavior.value
      response_headers_policy_id = aws_cloudfront_response_headers_policy.security[0].id
      target_origin_id           = "s3-${var.site_key}"
      viewer_protocol_policy     = "redirect-to-https"
    }
  }

  custom_error_response {
    error_caching_min_ttl = 60
    error_code            = 403
    response_code         = 404
    response_page_path    = var.error_document_path
  }

  custom_error_response {
    error_caching_min_ttl = 60
    error_code            = 404
    response_code         = 404
    response_page_path    = var.error_document_path
  }

  logging_config {
    bucket          = var.log_bucket_domain_name
    include_cookies = false
    prefix          = "cloudfront/${var.site_key}/"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }

  tags = {
    Site = var.site_key
  }
}

data "aws_iam_policy_document" "content" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.content.arn,
      "${aws_s3_bucket.content.arn}/*",
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  dynamic "statement" {
    for_each = var.enable_cloudfront ? [1] : []

    content {
      sid    = "AllowCloudFrontRead"
      effect = "Allow"

      principals {
        type        = "Service"
        identifiers = ["cloudfront.amazonaws.com"]
      }

      actions   = ["s3:GetObject"]
      resources = ["${aws_s3_bucket.content.arn}/*"]

      condition {
        test     = "StringEquals"
        variable = "AWS:SourceArn"
        values   = [aws_cloudfront_distribution.site[0].arn]
      }
    }
  }
}

resource "aws_s3_bucket_policy" "content" {
  bucket = aws_s3_bucket.content.id
  policy = data.aws_iam_policy_document.content.json
}
