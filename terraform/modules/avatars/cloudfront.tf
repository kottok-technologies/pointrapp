resource "aws_cloudfront_origin_access_control" "avatars" {
  name                              = "pointrapp-avatars-oac"
  description                       = "OAC for PointrApp avatar bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}


resource "aws_s3_bucket_policy" "avatars" {
  bucket = aws_s3_bucket.avatars.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid      = "AllowCloudFrontOACRead"
        Effect   = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.avatars.arn}",
          "${aws_s3_bucket.avatars.arn}/*"
        ]

        # 🔥 Required to restrict access ONLY to your distribution
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.avatars.arn
          }
        }
      }
    ]
  })
}

resource "aws_cloudfront_distribution" "avatars" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "PointrApp avatars CDN"
  default_root_object = ""

  aliases = [var.cdn_domain_avatars]

  origin {
    domain_name = aws_s3_bucket.avatars.bucket_regional_domain_name
    origin_id   = "avatars-origin"

    origin_access_control_id = aws_cloudfront_origin_access_control.avatars.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "avatars-origin"

    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

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
