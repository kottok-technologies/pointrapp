########################################
# WebSocket API Gateway
########################################

resource "aws_apigatewayv2_api" "ws_api" {
  name                       = "${var.project_name}-ws-${var.environment}"
  protocol_type               = "WEBSOCKET"
  route_selection_expression  = "$request.body.action"
}

# --- Integrations ---
resource "aws_apigatewayv2_integration" "connect" {
  api_id             = aws_apigatewayv2_api.ws_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.on_connect.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_integration" "disconnect" {
  api_id             = aws_apigatewayv2_api.ws_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.on_disconnect.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_integration" "broadcast" {
  api_id             = aws_apigatewayv2_api.ws_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.broadcast.invoke_arn
  integration_method = "POST"
}

resource "aws_apigatewayv2_integration" "register" {
  api_id             = aws_apigatewayv2_api.ws_api.id
  integration_type   = "AWS_PROXY"
  integration_uri    = aws_lambda_function.register.invoke_arn
  integration_method = "POST"
}

# --- Routes ---
resource "aws_apigatewayv2_route" "connect_route" {
  api_id    = aws_apigatewayv2_api.ws_api.id
  route_key = "$connect"
  target    = "integrations/${aws_apigatewayv2_integration.connect.id}"
}

resource "aws_apigatewayv2_route" "disconnect_route" {
  api_id    = aws_apigatewayv2_api.ws_api.id
  route_key = "$disconnect"
  target    = "integrations/${aws_apigatewayv2_integration.disconnect.id}"
}

resource "aws_apigatewayv2_route" "broadcast_route" {
  api_id    = aws_apigatewayv2_api.ws_api.id
  route_key = "broadcast"
  target    = "integrations/${aws_apigatewayv2_integration.broadcast.id}"
}

resource "aws_apigatewayv2_route" "register_route" {
  api_id    = aws_apigatewayv2_api.ws_api.id
  route_key = "register"
  target    = "integrations/${aws_apigatewayv2_integration.register.id}"
}

# --- Lambda Permissions ---
# Allow $connect route
resource "aws_lambda_permission" "connect_permission" {
  statement_id  = "AllowConnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.on_connect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws_api.execution_arn}/*/$connect"
}

# Allow $disconnect route
resource "aws_lambda_permission" "disconnect_permission" {
  statement_id  = "AllowDisconnect"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.on_disconnect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws_api.execution_arn}/*/$disconnect"
}

# Allow broadcast route
resource "aws_lambda_permission" "broadcast_permission" {
  statement_id  = "AllowBroadcast"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.broadcast.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws_api.execution_arn}/*/broadcast"
}

# Allow register route
resource "aws_lambda_permission" "register_permission" {
  statement_id  = "AllowRegister"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.register.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.ws_api.execution_arn}/*/register"
}

########################################
# Stage + Deployment
########################################

resource "aws_apigatewayv2_stage" "stage" {
  api_id      = aws_apigatewayv2_api.ws_api.id
  name        = var.stage
  auto_deploy = true
}

output "websocket_url" {
  value = aws_apigatewayv2_stage.stage.invoke_url
}

output "connections_table" {
  value = aws_dynamodb_table.ws_connections.name
}