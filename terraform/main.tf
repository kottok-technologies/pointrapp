module "ECR" {
  source = "./modules/ecr"

  ecr_repo = "pointrapp"
}