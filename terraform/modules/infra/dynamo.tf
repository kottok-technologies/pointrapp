# ===========================================================
# DynamoDB Table for PointrApp
# ===========================================================

resource "aws_dynamodb_table" "pointrapp" {
  name         = "PointrApp-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"

  deletion_protection_enabled = true
  point_in_time_recovery {
    enabled = true
  }

  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # For GSI1: EntityType + CreatedAt
  attribute {
    name = "EntityType"
    type = "S"
  }

  attribute {
    name = "CreatedAt"
    type = "S"
  }

  # For GSI2: UserId + RoomId
  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "RoomId"
    type = "S"
  }

  # For GSI3: StoryId + RoomId
  attribute {
    name = "StoryId"
    type = "S"
  }

  # Global Secondary Indexes
  global_secondary_index {
    name            = "GSI1_EntityTypeCreatedAt"
    hash_key        = "EntityType"
    range_key       = "CreatedAt"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI2_UserRoom"
    hash_key        = "UserId"
    range_key       = "RoomId"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "GSI3_StoryRoom"
    hash_key        = "StoryId"
    range_key       = "RoomId"
    projection_type = "ALL"
  }

  # Table configuration
  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project = "PointrApp"
    Env     = var.environment
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

