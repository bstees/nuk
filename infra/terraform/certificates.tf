resource "aws_acm_certificate" "site" {
  for_each = local.sites
  provider = aws.us_east_1

  domain_name       = each.value.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Site = each.key
  }
}
