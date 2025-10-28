resource "aws_apprunner_service" "pointrapp" {
  service_name = "pointrapp-${var.environment}"

  source_configuration {
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
    instance_role_arn = aws_iam_role.app_runner_role.arn
  }

  tags = {
    Environment = var.environment
    Project     = "PointrApp"
  }
}

