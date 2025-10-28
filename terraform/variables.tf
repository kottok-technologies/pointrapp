variable "environment" {
  type        = string
  description = "Environment name (production/testing)"
}

variable "image_uri" {
  type        = string
  description = "ECR image URI to deploy"
}

variable "ecr_repo" {
  type        = string
  default     = "pointrapp"
}

