data "aws_iam_policy_document" "pointrapp_access" {
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem"
    ]
    resources = [
      aws_dynamodb_table.pointrapp.arn,
      "${aws_dynamodb_table.pointrapp.arn}/index/*"
    ]
  }
}

resource "aws_iam_policy" "pointrapp_dynamo_policy" {
  name        = "PointrAppDynamoAccess"
  description = "Allows access to the PointrApp DynamoDB table"
  policy      = data.aws_iam_policy_document.pointrapp_access.json
}

