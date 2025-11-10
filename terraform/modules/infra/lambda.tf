########################################
# Lambda Functions
########################################

resource "aws_lambda_function" "on_connect" {
  function_name = "${var.project_name}-on-connect-${var.environment}"
  filename      = "${path.module}/lambdas/dist/onConnect.zip"
  source_code_hash = filebase64sha256("${path.module}/lambdas/dist/onConnect.zip")
  handler       = "onConnect.handler"
  runtime       = var.lambda_runtime
  role          = aws_iam_role.lambda_role.arn
  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.ws_connections.name
    }
  }
}

resource "aws_lambda_function" "on_disconnect" {
  function_name = "${var.project_name}-on-disconnect-${var.environment}"
  filename      = "${path.module}/lambdas/dist/onDisconnect.zip"
  source_code_hash = filebase64sha256("${path.module}/lambdas/dist/onDisconnect.zip")
  handler       = "onDisconnect.handler"
  runtime       = var.lambda_runtime
  role          = aws_iam_role.lambda_role.arn
  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.ws_connections.name
    }
  }
}

resource "aws_lambda_function" "broadcast" {
  function_name = "${var.project_name}-broadcast-${var.environment}"
  filename      = "${path.module}/lambdas/dist/broadcast.zip"
  source_code_hash = filebase64sha256("${path.module}/lambdas/dist/broadcast.zip")
  handler       = "broadcast.handler"
  runtime       = var.lambda_runtime
  role          = aws_iam_role.lambda_role.arn
  environment {
    variables = {
      CONNECTIONS_TABLE = aws_dynamodb_table.ws_connections.name
    }
  }
}