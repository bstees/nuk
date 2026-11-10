resource "aws_sns_topic" "operations" {
  count    = var.alert_email == null ? 0 : 1
  provider = aws.us_east_1

  name = "${local.name_prefix}-operations"
}

resource "aws_sns_topic_subscription" "operations_email" {
  count    = var.alert_email == null ? 0 : 1
  provider = aws.us_east_1

  topic_arn = aws_sns_topic.operations[0].arn
  protocol  = "email"
  endpoint  = var.alert_email
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx" {
  for_each = var.enable_cloudfront && var.alert_email != null ? local.sites : {}
  provider = aws.us_east_1

  alarm_name          = "${local.name_prefix}-${each.key}-cloudfront-5xx"
  alarm_description   = "${each.key} CloudFront 5xx error rate exceeded 5 percent for ten minutes."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  datapoints_to_alarm = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = module.static_site[each.key].distribution_id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.operations[0].arn]
  ok_actions    = [aws_sns_topic.operations[0].arn]
}

resource "aws_budgets_budget" "monthly" {
  count    = var.alert_email == null ? 0 : 1
  provider = aws.us_east_1

  name         = "${local.name_prefix}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = [format("user:Project$%s", var.project_name)]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    notification_type          = "FORECASTED"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    subscriber_email_addresses = [var.alert_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    notification_type          = "ACTUAL"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    subscriber_email_addresses = [var.alert_email]
  }
}
