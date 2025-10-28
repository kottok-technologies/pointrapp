resource "aws_ecr_repository" "pointrapp" {
  name                 = var.ecr_repo
  image_tag_mutability = "MUTABLE"

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    application     = "pointrapp"
  }
}

output "ecr_repository_url" {
  value = aws_ecr_repository.pointrapp.repository_url
}