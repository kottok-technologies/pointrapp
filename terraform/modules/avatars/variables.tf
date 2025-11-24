variable "project_name" {
  type = string
  description = "Identifier for the project."
}

variable "environment" {
  type        = string
  description = "Environment name (prod/dev)"
  default     = "dev"
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