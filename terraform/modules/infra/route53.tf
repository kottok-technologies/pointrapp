resource "aws_route53_record" "avatars_cname" {
  zone_id = var.route53_zone_id
  name    = "cdn.pointrapp.com"
  type    = "CNAME"
  ttl     = 300
  records = [aws_cloudfront_distribution.avatars.domain_name]
}

resource "aws_route53_record" "avatars_validation" {
  for_each = {
    for dvo in aws_acm_certificate.avatars_cdn.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = var.route53_zone_id
}