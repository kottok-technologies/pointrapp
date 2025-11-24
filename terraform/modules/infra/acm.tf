resource "aws_acm_certificate" "avatars_cdn" {
  domain_name       = "cdn.pointrapp.com"
  validation_method = "DNS"
}

resource "aws_acm_certificate_validation" "avatars_cdn_validation" {
  certificate_arn         = aws_acm_certificate.avatars_cdn.arn
  validation_record_fqdns = [for record in aws_route53_record.avatars_validation : record.fqdn]
}
