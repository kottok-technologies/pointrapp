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


########################################
# Lambda Roles + Policies
########################################

data "aws_iam_policy_document" "lambda_policy" {
  statement {
    actions = [
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query"
    ]
    resources = [
      aws_dynamodb_table.ws_connections.arn,
      "${aws_dynamodb_table.ws_connections.arn}/index/*"
    ]
  }

  statement {
    actions   = ["execute-api:ManageConnections"]
    resources = ["*"] # restrict later to your WS API ARN if needed
  }

  statement {
    actions = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["*"]
  }
}

resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-ws-role-${var.environment}"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_policy" "lambda_policy" {
  name   = "${var.project_name}-ws-policy-${var.environment}"
  policy = data.aws_iam_policy_document.lambda_policy.json
}

resource "aws_iam_role_policy_attachment" "lambda_attach" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_policy.arn
}