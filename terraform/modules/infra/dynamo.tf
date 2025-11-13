# ===========================================================
# DynamoDB Table for PointrApp
# ===========================================================

resource "aws_dynamodb_table" "pointrapp" {
  name         = "${var.project_name}-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"

  deletion_protection_enabled = true
  point_in_time_recovery {
    enabled = true
  }

  stream_enabled = true

  stream_view_type = "NEW_AND_OLD_IMAGES"

  server_side_encryption {
    enabled = true
  }

  hash_key  = "PK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "RoomId"
    type = "S"
  }

  attribute {
    name = "EntityType"
    type = "S"
  }

  ##########################################################
  # GSI #1 – RoomIndex
  # Query all items (users, stories, votes, etc.) in one room
  ##########################################################
  global_secondary_index {
    name               = "RoomIndex"
    hash_key           = "RoomId"
    projection_type    = "ALL"
  }

  ##########################################################
  # GSI #2 – RoomEntityIndex
  # Query all items of a specific type within one room
  ##########################################################
  global_secondary_index {
    name               = "RoomEntityIndex"
    hash_key           = "RoomId"
    range_key          = "EntityType"
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
    Application = var.project_name
  }
}

# ===========================================================
# WebSocket Table for event handling
# ===========================================================

resource "aws_dynamodb_table" "ws_connections" {
  name         = "pointrapp_ws_connections_${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "ConnectionId"

  attribute {
    name = "ConnectionId"
    type = "S"
  }

  attribute {
    name = "RoomId"
    type = "S"
  }

  global_secondary_index {
    name            = "RoomIdIndex"
    hash_key        = "RoomId"
    projection_type = "ALL"
  }
}

# ===========================================================
# Outputs
# ===========================================================

output "pointrapp_table_name" {
  value = aws_dynamodb_table.pointrapp.name
}

output "pointrapp_table_arn" {
  value = aws_dynamodb_table.pointrapp.arn
}

