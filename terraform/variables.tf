variable "project_name" {
  type        = string
  description = "Name of this project"
  default     = "PointrApp"
}

variable "environment" {
  type        = string
  description = "Environment name (prod/dev)"
  default     = "dev"
}

variable "image_uri" {
  type        = string
  description = "ECR image URI to deploy"
  default     = "placeholder"
}

variable "route53_zone_id" {
  type        = string
  description = "Zone ID for pointrapp in R53"
  default     = "Z021125431208XT5W7T05"
}

variable "cdn_domain_avatars" {
  type        = string
  description = "CDN domain for avatar hosting"
  default     = "cdn.pointrapp.com"
}