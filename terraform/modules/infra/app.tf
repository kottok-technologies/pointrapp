resource "aws_apprunner_service" "pointrapp" {
  service_name = "pointrapp-${var.environment}"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_access_role.arn
    }

    image_repository {
      image_identifier      = var.image_uri
      image_repository_type = "ECR"
      image_configuration {
        port = "3000"
      }
    }
    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu    = "1024"
    memory = "2048"
    instance_role_arn = aws_iam_role.apprunner_instance_role.arn
  }

  tags = {
    Environment = var.environment
    Project     = "PointrApp"
  }
}

# Custom domain association
resource "aws_apprunner_custom_domain_association" "domain" {
  service_arn = aws_apprunner_service.pointrapp.arn
  domain_name = var.environment == "dev" ? "dev.pointrapp.com" : "www.pointrapp.com"
}
