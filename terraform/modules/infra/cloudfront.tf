resource "aws_cloudfront_origin_access_identity" "avatars" {
  comment = "OAI for pointrapp avatars"
}

resource "aws_s3_bucket_policy" "avatars" {
  bucket = aws_s3_bucket.avatars.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid    = "AllowCloudFrontRead"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.avatars.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.avatars.arn}/*"
      }
    ]
  })
}

resource "aws_cloudfront_distribution" "avatars" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "PointrApp avatars CDN"
  default_root_object = ""

  aliases = "cdn.pointrapp.com"

  origin {
    domain_name = aws_s3_bucket.avatars.bucket_regional_domain_name
    origin_id   = "avatars-origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.avatars.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "avatars-origin"

    viewer_protocol_policy = "redirect-to-https"

    compress = true

    min_ttl     = 0
    default_ttl = 86400      # 1 day
    max_ttl     = 31536000   # 1 year
  }

  price_class = "PriceClass_100"

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.avatars_cdn.arn
    ssl_support_method  = "sni-only"
  }

  tags = {
    Environment = var.environment
    Application = var.project_name
  }
}
