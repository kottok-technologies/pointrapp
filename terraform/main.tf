module "ECR" {
  source = "./modules/ecr"
  project_name = var.project_name
}

module "INFRA" {
  source = "./modules/infra"
  project_name = var.project_name
  image_uri = var.image_uri
  environment = var.environment
  route53_zone_id = var.route53_zone_id
}