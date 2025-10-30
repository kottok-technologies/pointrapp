# Route53 record pointing subdomain to App Runner default URL
resource "aws_route53_record" "subdomain" {
  zone_id = var.route53_zone_id
  name    = var.environment == "dev" ? "dev" : "www"
  type    = "CNAME"
  ttl     = 300
  records = [var.dns_target]
}

# Validation record for ACM certificate (DNS-01 challenge)
locals {
  safe_validation_records = (
    var.certificate_validation_records != null
    ? var.certificate_validation_records
    : []
  )
}

resource "aws_route53_record" "validation" {
  for_each = {
    for r in local.safe_validation_records : r.name => r
  }
  zone_id = var.route53_zone_id
  name    = each.value.name
  type    = each.value.type
  records = [each.value.value]
  ttl     = 60
}
