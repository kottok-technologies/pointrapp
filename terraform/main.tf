module "ecr" {
  source = "./modules/ecr"
  project_name = var.project_name
}

module "infra" {
  source = "./modules/infra"
  project_name = var.project_name
  image_uri = var.image_uri
  environment = var.environment
  route53_zone_id = var.route53_zone_id
}

module "route53" {
  source = "./modules/route53"
  environment = var.environment
  route53_zone_id = var.route53_zone_id
  dns_target = var.dns_target
  certificate_validation_records = var.certificate_validation_records
}

module "avatars" {
  source = "./modules/avatars"
  project_name = var.project_name
  environment = var.environment
  route53_zone_id = var.route53_zone_id
  cdn_domain_avatars = var.cdn_domain_avatars
}

output "dns_target" {
  description = "App Runner DNS target"
  value       = module.infra.dns_target
}

output "certificate_validation_records" {
  description = "ACM validation records for App Runner domain"
  value       = module.infra.certificate_validation_records
}

output "service_arn" {
  description = "App Runner service ARN"
  value       = module.infra.service_arn
}
