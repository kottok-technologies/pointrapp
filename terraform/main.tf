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