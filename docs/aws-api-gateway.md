# PortTrack - AWS API Gateway

## **AWS API Gateway - Solución Principal**

### **Características Principales**

#### **Ventajas:**
- **Fully Managed**: Sin gestión de infraestructura
- **Escalabilidad Automática**: Se adapta automáticamente a la demanda
- **Integración Nativa**: Perfecta integración con servicios AWS
- **Monitoreo**: CloudWatch integrado
- **Seguridad**: IAM, WAF, y certificados SSL automáticos
- **Costos Predecibles**: Pay-per-use con capas gratuitas

#### **Consideraciones:**
- **Vendor Lock-in**: Dependencia de AWS
- **Costos**: Puede ser más caro para tráfico alto
- **Limitaciones**: Algunas funcionalidades avanzadas limitadas
- **Configuración**: Curva de aprendizaje para AWS

## **Configuración de AWS API Gateway**

### **1. Configuración de AWS API Gateway**

#### **API Definition (OpenAPI 3.0):**
```yaml
# aws-api-gateway/openapi.yaml
openapi: 3.0.0
info:
  title: PortTrack API
  version: 1.0.0
  description: API Gateway para PortTrack Platform

servers:
  - url: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}
    variables:
      api-id:
        default: "your-api-id"
      region:
        default: "us-east-1"
      stage:
        default: "dev"

paths:
  /api/ships:
    get:
      summary: Obtener lista de barcos
      security:
        - ApiKeyAuth: []
      responses:
        '200':
          description: Lista de barcos
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Ship'
        '401':
          description: No autorizado
        '429':
          description: Rate limit excedido

  /api/cargo:
    get:
      summary: Obtener lista de carga
      security:
        - ApiKeyAuth: []
      responses:
        '200':
          description: Lista de carga
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Cargo'

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key

  schemas:
    Ship:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        imo_number:
          type: string
        ship_type:
          type: string
        status:
          type: string
          enum: [active, inactive, maintenance]

    Cargo:
      type: object
      properties:
        id:
          type: string
          format: uuid
        cargo_type:
          type: string
        weight_kg:
          type: number
        hazardous:
          type: boolean
```

#### **Terraform Configuration:**
```hcl
# aws-api-gateway/main.tf

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
```

### **2. Lambda Authorizer para Auth0**

#### **Código del Authorizer:**
```javascript
// aws-api-gateway/lambda/authorizer/index.js

const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

exports.handler = async (event) => {
  try {
    const token = event.authorizationToken.replace('Bearer ', '');
    
    const decoded = jwt.verify(token, getKey, {
      audience: process.env.AUTH0_AUDIENCE,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    });
    
    return {
      principalId: decoded.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn
          }
        ]
      },
      context: {
        userId: decoded.sub,
        email: decoded.email,
        scope: decoded.scope
      }
    };
  } catch (error) {
    throw new Error('Unauthorized');
  }
};
```

### **3. Configuración de Rate Limiting**

#### **Usage Plans por Entorno:**
```hcl
# Usage Plan para Desarrollo
resource "aws_api_gateway_usage_plan" "dev" {
  name = "porttrack-dev-usage-plan"
  
  throttle_settings {
    burst_limit = 50
    rate_limit  = 500
  }
  
  quota_settings {
    limit  = 10000
    period = "DAY"
  }
}

# Usage Plan para Staging
resource "aws_api_gateway_usage_plan" "staging" {
  name = "porttrack-staging-usage-plan"
  
  throttle_settings {
    burst_limit = 100
    rate_limit  = 1000
  }
  
  quota_settings {
    limit  = 50000
    period = "DAY"
  }
}

# Usage Plan para Producción
resource "aws_api_gateway_usage_plan" "production" {
  name = "porttrack-production-usage-plan"
  
  throttle_settings {
    burst_limit = 500
    rate_limit  = 5000
  }
  
  quota_settings {
    limit  = 1000000
    period = "DAY"
  }
}
```

### **4. Monitoreo y Alertas**

#### **CloudWatch Alarms:**
```hcl
# CloudWatch Alarms para API Gateway
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "porttrack-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "4XX errors en API Gateway"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.porttrack.name
    Stage   = "production"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "porttrack-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "5XX errors en API Gateway"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.porttrack.name
    Stage   = "production"
  }
}

resource "aws_cloudwatch_metric_alarm" "api_latency" {
  alarm_name          = "porttrack-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Average"
  threshold           = "2000"
  alarm_description   = "Latencia alta en API Gateway"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.porttrack.name
    Stage   = "production"
  }
}
```

### **5. Integración con CI/CD**

#### **GitHub Actions para AWS API Gateway:**
```yaml
# .github/workflows/deploy-api-gateway.yml
name: Deploy AWS API Gateway

on:
  push:
    branches: [ main, develop ]
    paths: [ 'aws-api-gateway/**' ]

env:
  AWS_REGION: us-east-1

jobs:
  deploy-api-gateway:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}
        
    - name: Setup Terraform
      uses: hashicorp/setup-terraform@v3
      
    - name: Terraform Init
      working-directory: ./aws-api-gateway
      run: terraform init
      
    - name: Terraform Plan
      working-directory: ./aws-api-gateway
      run: terraform plan -out=tfplan
      
    - name: Terraform Apply
      working-directory: ./aws-api-gateway
      run: terraform apply tfplan
      
    - name: Deploy API
      run: |
        API_ID=$(aws apigateway get-rest-apis --query 'items[?name==`porttrack-api`].id' --output text)
        aws apigateway create-deployment \
          --rest-api-id $API_ID \
          --stage-name production
```

## **Análisis de Costos**

### **AWS API Gateway:**
- **API Calls**: $3.50 por millón de requests
- **Data Transfer**: $0.09/GB
- **Cache**: $0.02 por hora por GB
- **Total Estimado**: $100-500/mes (dependiendo del tráfico)

### **Ventajas de Costos:**
- **Sin costos de infraestructura**: No hay servidores que mantener
- **Sin costos de DevOps**: AWS gestiona todo automáticamente
- **Escalabilidad automática**: Solo pagas por lo que usas
- **Capas gratuitas**: Hasta 1 millón de requests por mes

## **Por qué AWS API Gateway**

### **AWS API Gateway es la elección ideal para PortTrack porque:**

1. **Costos Reducidos**: Más económico para la mayoría de casos de uso
2. **Escalabilidad Automática**: Se adapta automáticamente a la demanda
3. **Integración AWS**: Perfecta integración con otros servicios AWS
4. **Monitoreo Integrado**: CloudWatch y alertas automáticas
5. **Seguridad Avanzada**: WAF, IAM, y certificados SSL automáticos
6. **Gestión Automática**: Sin necesidad de gestionar infraestructura
7. **Confiabilidad**: SLA del 99.95% de disponibilidad

## **Plan de Implementación**

### **Fase 1: Preparación (1-2 semanas)**
- Configurar AWS CLI y credenciales
- Crear infraestructura base con Terraform
- Configurar CI/CD para AWS

### **Fase 2: Desarrollo (2-3 semanas)**
- Implementar API Gateway
- Configurar Lambda Authorizer
- Implementar rate limiting y monitoreo

### **Fase 3: Testing (1 semana)**
- Tests de integración
- Validación de performance
- Tests de seguridad

### **Fase 4: Despliegue (1 semana)**
- Despliegue gradual
- Monitoreo y validación
- Rollback plan si es necesario

## **Recursos Adicionales**

- [AWS API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [API Gateway Best Practices](https://docs.aws.amazon.com/apigateway/latest/developerguide/best-practices.html)
- [Lambda Authorizer Examples](https://github.com/aws-samples/aws-api-gateway-lambda-authorizer-blueprints)
