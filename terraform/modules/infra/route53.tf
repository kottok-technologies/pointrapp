resource "aws_route53_record" "validation" {
  for_each = {
    for r in aws_apprunner_custom_domain_association.domain.certificate_validation_records : r.name => r
  }
  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.value]
  ttl     = 60

  depends_on = [aws_apprunner_custom_domain_association.domain]
}