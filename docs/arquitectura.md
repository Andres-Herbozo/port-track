# PortTrack - Arquitectura

## Arquitectura de Alto Nivel

### Componentes Principales
- **Aplicación Web**: Node.js + Express
- **Base de Datos**: PostgreSQL
- **Cache**: Redis
- **Monitoreo**: Prometheus + Grafana
- **Contenedores**: Docker
- **Orquestación**: Kubernetes

## Estrategia de Despliegue

### Tipo de Despliegue
- **Rolling Update**: Actualización gradual sin tiempo de inactividad
- **Replicas**: 2 pods para alta disponibilidad
- **Health Checks**: Verificación de salud automática

### Herramientas CI/CD
- **GitHub Actions**: Pipeline básico de CI/CD
- **Docker**: Construcción y distribución de imágenes
- **Kubernetes**: Despliegue y gestión

## Entornos

### Desarrollo (DEV)
- **Docker Compose**: Entorno local completo
- **Puertos**: 3000 (app), 5432 (DB), 6379 (Redis), 9090 (Prometheus), 3000 (Grafana)

### Producción (PROD)
- **Kubernetes**: Cluster de producción
- **Namespaces**: Separación de recursos
- **Servicios**: Load balancing automático

## Monitoreo

### Prometheus
- **Métricas**: Aplicación, nodos Kubernetes, AWS API Gateway
- **Intervalo**: 30 segundos
- **Retención**: 15 días
- **Puerto**: 9090

### Grafana
- **Dashboards**: PortTrack Overview, Infraestructura, AWS API Gateway
- **Alertas**: Slack integrado
- **Usuarios**: Admin por defecto
- **Puerto**: 3000

*Para configuración detallada, ver `docs/monitoreo.md`*

## Seguridad

### Gestión de Secretos
- **Kubernetes Secrets**: Encriptación básica
- **RBAC**: Roles simples de usuario

### Red
- **Network Policies**: Básicas
- **Pod Security**: Estándares mínimos

## Escalabilidad

### Auto-scaling
- **Horizontal**: Basado en CPU y memoria
- **Vertical**: Límites de recursos definidos

### Recursos
- **CPU**: 250m - 500m por pod
- **Memoria**: 256Mi - 512Mi por pod

## Alertas

### Críticas
- **Aplicación caída**: 1 minuto
- **Nodo caído**: 1 minuto

### Advertencias
- **Tiempo de respuesta alto**: 5 minutos
- **Uso de CPU alto**: 5 minutos

## Rollback

### Estrategia
- **Automático**: Health checks fallidos
- **Manual**: Comando kubectl
- **Tiempo**: 5 minutos máximo
