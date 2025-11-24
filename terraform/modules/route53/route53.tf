# Route53 record pointing subdomain to App Runner default URL
resource "aws_route53_record" "subdomain" {
  zone_id = var.route53_zone_id
  name    = var.environment == "dev" ? "dev" : "www"
  type    = "CNAME"
  ttl     = 300
  records = [var.dns_target]
}
