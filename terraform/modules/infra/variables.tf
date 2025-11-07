variable "project_name" {
  type = string
  description = "Identifier for the project."
}

variable "environment" {
  type        = string
  description = "Environment name (prod/dev)"
  default     = "dev"
}

variable "image_uri" {
  type        = string
  description = "ECR image URI to deploy"
}

variable "route53_zone_id" {
  type        = string
  description = "Zone ID for pointrapp in R53"
  default     = "Z021125431208XT5W7T05"
}

variable "aws_region" {
  type        = string
  description = "AWS Region"
  default     = "us-east-1"
}

variable "stage" {
  type        = string
  description = "Stage for the WebSocket APIs"
  default     = "dev"
}

variable "lambda_runtime" {
  type        = string
  description = "Version of lambda"
  default     = "nodejs20.x"
}