# AWS API Gateway para PortTrack
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# API Gateway
resource "aws_api_gateway_rest_api" "porttrack" {
  name        = "porttrack-api"
  description = "PortTrack API Gateway"
}

# API Key
resource "aws_api_gateway_api_key" "porttrack" {
  name = "porttrack-api-key"
}

# Usage Plan
resource "aws_api_gateway_usage_plan" "porttrack" {
  name = "porttrack-usage-plan"
  
  api_stages {
    api_id = aws_api_gateway_rest_api.porttrack.id
    stage  = aws_api_gateway_deployment.porttrack.stage_name
  }
  
  throttle_settings {
    burst_limit = 100
    rate_limit  = 1000
  }
  
  quota_settings {
    limit  = 100000
    period = "DAY"
  }
}

# Usage Plan Key
resource "aws_api_gateway_usage_plan_key" "porttrack" {
  key_id        = aws_api_gateway_api_key.porttrack.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.porttrack.id
}

# Lambda Authorizer
resource "aws_lambda_function" "authorizer" {
  filename         = "lambda/authorizer.zip"
  function_name    = "porttrack-authorizer"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  
  environment {
    variables = {
      AUTH0_DOMAIN = var.auth0_domain
      AUTH0_AUDIENCE = var.auth0_audience
    }
  }
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "porttrack-lambda-exec"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda Permission
resource "aws_lambda_permission" "authorizer" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.porttrack.execution_arn}/*/*"
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "auth0_domain" {
  description = "Auth0 domain"
  type        = string
}

variable "auth0_audience" {
  description = "Auth0 audience"
  type        = string
}

# Outputs
output "api_gateway_url" {
  value = aws_api_gateway_rest_api.porttrack.execution_arn
}

output "api_key" {
  value = aws_api_gateway_api_key.porttrack.value
}
