resource "aws_s3_bucket" "avatars" {
  bucket = "${var.project_name.lower()}-avatars"

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