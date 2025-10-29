# IAM access role for App Runner
resource "aws_iam_role" "apprunner_access_role" {
  name = "pointrapp-apprunner-access-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "build.apprunner.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
      Environment = var.environment
    Application = var.project_name
  }
}

# IAM policy granting access ECR
resource "aws_iam_policy" "apprunner_access_role_policy" {
  name = "pointrapp-apprunner-access-role-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect  = "Allow"
        Action  = ["ecr:*"]
        Resource= "*"
      }
    ]
  })
}

# Attach access role policy to role
resource "aws_iam_role_policy_attachment" "apprunner_access_role_attach" {
  role       = aws_iam_role.apprunner_access_role.name
  policy_arn = aws_iam_policy.apprunner_access_role_policy.arn
}


# IAM instance role for App Runner
resource "aws_iam_role" "apprunner_instance_role" {
  name = "pointrapp-apprunner-instance-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "tasks.apprunner.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Environment = var.environment
    Application = var.project_name
  }
}

# IAM policy granting access to this school's DynamoDB tables
resource "aws_iam_policy" "apprunner_instance_role_policy" {
  name = "pointrapp-apprunner-instance-role-policy-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.pointrapp.arn,
          "${aws_dynamodb_table.pointrapp.arn}/index/*"
        ]
      },
      {
        Effect  = "Allow"
        Action  = ["ecr:*"]
        Resource= "*"
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "apprunner_instance_role_attach" {
  role       = aws_iam_role.apprunner_instance_role.name
  policy_arn = aws_iam_policy.apprunner_instance_role_policy.arn
}