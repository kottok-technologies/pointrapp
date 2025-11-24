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

module "avatars" {
  source = "./modules/avatars"
  project_name = var.project_name
  environment = var.environment
  route53_zone_id = var.route53_zone_id
  cdn_domain_avatars = var.cdn_domain_avatars
}
