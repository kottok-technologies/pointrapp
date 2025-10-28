module "ECR" {
  source = "./modules/ecr"

  ecr_repo = "pointrapp"
}

module "INFRA" {
  source = "./modules/infra"

  image_uri = var.image_uri
  environment = var.environment
  route53_zone_id = var.route53_zone_id
}