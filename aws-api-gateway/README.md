# AWS API Gateway - PortTrack

## Descripción

Esta carpeta contiene la configuración completa para AWS API Gateway de PortTrack.

## Estructura

```
aws-api-gateway/
├── openapi.yaml           # Definición OpenAPI 3.0
├── main.tf                # Configuración Terraform
├── terraform.tfvars.example # Variables de ejemplo
├── lambda/                # Lambda Authorizer
│   ├── authorizer/
│   │   └── index.js      # Código del authorizer
│   └── package.json      # Dependencias del authorizer
└── README.md             # Esta documentación
```

## Características

- **Rate Limiting**: Configurado por entorno (dev, staging, production)
- **Autenticación**: Lambda Authorizer integrado con Auth0
- **CORS**: Configurado para desarrollo y producción
- **Monitoreo**: CloudWatch integrado con alertas automáticas
- **Escalabilidad**: Automática según la demanda

## Configuración

### 1. Variables de Entorno

Copia `terraform.tfvars.example` a `terraform.tfvars` y configura:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edita las variables según tu configuración:

```hcl
aws_region = "us-east-1"
auth0_domain = "tu-dominio.auth0.com"
auth0_audience = "https://tu-api.com"
```

### 2. Despliegue

```bash
cd aws-api-gateway
terraform init
terraform plan
terraform apply
```

### 3. Lambda Authorizer

```bash
cd lambda/authorizer
npm install
npm run build
```

## Monitoreo

- **CloudWatch Alarms**: Errores 4xx/5xx, latencia
- **Métricas**: Requests, errores, latencia
- **Logs**: Acceso y errores automáticos

## Costos Estimados

- **API Calls**: $3.50 por millón de requests
- **Data Transfer**: $0.09/GB
- **Total Estimado**: $100-500/mes (dependiendo del tráfico)

## Ventajas de AWS API Gateway

- ✅ **Fully Managed**: Sin gestión de infraestructura
- ✅ **Escalabilidad Automática**: Se adapta a la demanda
- ✅ **Monitoreo Integrado**: CloudWatch automático
- ✅ **Seguridad Avanzada**: WAF, IAM, SSL automáticos
- ✅ **Costos Reducidos**: Más económico para la mayoría de casos
