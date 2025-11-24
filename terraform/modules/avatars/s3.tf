resource "aws_s3_bucket" "avatars" {
  bucket = "${lower(var.project_name)}-avatars"

  tags = {
    Environment = var.environment
    Application = var.project_name
  }
}

resource "aws_s3_bucket_public_access_block" "avatars" {
  bucket = aws_s3_bucket.avatars.id

  block_public_acls       = true
  block_public_policy     = false
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "avatars_cors" {
  bucket = aws_s3_bucket.avatars.bucket

  cors_rule {
    id = "pointrapp-avatars"
    allowed_methods = ["GET", "HEAD", "PUT"]
    allowed_origins = [
      "http://localhost:3000",
      "https://pointr.app",
      "https://www.pointr.app",
      "https://dev.pointr.app",
      "https://cdn.pointrapp.com"
    ]
    allowed_headers = ["*"]
    expose_headers  = []
    max_age_seconds = 3000
  }
}
