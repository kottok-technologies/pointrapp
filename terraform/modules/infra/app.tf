resource "aws_apprunner_service" "pointrapp" {
  service_name = "${var.project_name}-${var.environment}"

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
    Application = var.project_name
  }
}

# Custom domain association
resource "aws_apprunner_custom_domain_association" "domain" {
  service_arn = aws_apprunner_service.pointrapp.arn
  domain_name = var.environment == "dev" ? "dev.pointrapp.com" : "www.pointrapp.com"
}

output "dns_target" {
  value = aws_apprunner_custom_domain_association.domain.dns_target
}

output "certificate_validation_records"  {
  value = aws_apprunner_custom_domain_association.domain.certificate_validation_records
}