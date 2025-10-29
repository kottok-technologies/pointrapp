resource "aws_ecr_repository" "pointrapp" {
  name                 = lower(var.project_name)
  image_tag_mutability = "MUTABLE"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    application     = var.project_name
  }
}

output "ecr_repository_url" {
  value = aws_ecr_repository.pointrapp.repository_url
}