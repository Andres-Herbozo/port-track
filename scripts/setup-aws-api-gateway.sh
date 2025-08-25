#!/bin/bash

# Script de Configuración de AWS API Gateway
# PortTrack Platform

set -e

echo "🚀 Configurando AWS API Gateway para PortTrack..."

# Verificar dependencias
echo "📋 Verificando dependencias..."
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI no está instalado. Instálalo primero."; exit 1; }
command -v terraform >/dev/null 2>&1 || { echo "❌ Terraform no está instalado. Instálalo primero."; exit 1; }

# Verificar credenciales AWS
echo "🔐 Verificando credenciales AWS..."
aws sts get-caller-identity >/dev/null 2>&1 || { echo "❌ Credenciales AWS no configuradas. Ejecuta 'aws configure' primero."; exit 1; }

# Configurar AWS API Gateway
echo "🔧 Configurando AWS API Gateway..."
cd aws-api-gateway

# Copiar variables de ejemplo
if [ ! -f "terraform.tfvars" ]; then
    cp terraform.tfvars.example terraform.tfvars
    echo "⚠️  Archivo terraform.tfvars creado. Edítalo con tus valores antes de continuar."
    echo "📝 Variables a configurar:"
    echo "   - aws_region"
    echo "   - auth0_domain"
    echo "   - auth0_audience"
    exit 0
fi

# Inicializar Terraform
echo "🏗️  Inicializando Terraform..."
terraform init

# Plan de despliegue
echo "📋 Generando plan de despliegue..."
terraform plan -out=tfplan

# Confirmar despliegue
read -p "¿Deseas continuar con el despliegue? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Aplicando configuración..."
    terraform apply tfplan
    
    echo "✅ AWS API Gateway desplegado exitosamente!"
    echo "🔑 API Key: $(terraform output -raw api_key)"
    echo "🌐 URL: $(terraform output -raw api_gateway_url)"
    
    # Actualizar variables de entorno
    echo "📝 Actualizando variables de entorno..."
    cd ..
    
    # Crear archivo .env si no existe
    if [ ! -f ".env" ]; then
        cp env.example .env
    fi
    
    # Actualizar URL del API Gateway
    API_URL=$(cd aws-api-gateway && terraform output -raw api_gateway_url)
    sed -i.bak "s|AWS_API_GATEWAY_URL=.*|AWS_API_GATEWAY_URL=$API_URL|" .env
    
    echo "✅ Configuración completada exitosamente!"
    echo "📚 Revisa la documentación en aws-api-gateway/README.md"
    echo "🔄 Reinicia los servicios con: docker-compose up -d"
    
else
    echo "❌ Configuración cancelada por el usuario"
    exit 1
fi
