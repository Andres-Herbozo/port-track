# PortTrack - Plataforma de Navegación Portuaria

## Descripción del Proyecto

PortTrack es una plataforma de navegación portuaria completa que permite monitorear y gestionar el flujo de embarcaciones en un puerto comercial con capacidades avanzadas de monitoreo, logging y seguridad.

## Arquitectura Completa

### Estrategia de Despliegue
- **Tipo**: Rolling Update con capacidades Blue-Green
- **CI/CD**: GitHub Actions avanzado con múltiples entornos
- **Entornos**: DEV, STAGING, TEST, PROD

### Monitoreo Avanzado
- **Prometheus + Grafana**: Métricas completas y dashboards
- **ELK Stack**: Elasticsearch, Logstash, Kibana para logging
- **AlertManager**: Sistema de alertas con notificaciones múltiples
- **Jaeger**: Distributed tracing

### ChatOps y Seguridad
- **Slack**: Notificaciones automáticas y ChatOps
- **Auth0**: Autenticación y autorización avanzada
- **AWS API Gateway**: Rate limiting, CORS, autenticación, escalabilidad automática
- **Nginx**: Reverse proxy con seguridad

### Bases de Datos
- **PostgreSQL**: Base de datos principal (SQL)
- **MongoDB**: Base de datos NoSQL para datos flexibles
- **Redis**: Cache y sesiones

## Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose
- Kubernetes (minikube o cluster)
- Helm (opcional)

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd porttrack

# Configurar variables de entorno
cp env.example .env
# Editar .env con tus configuraciones

# Levantar entorno completo
docker-compose up -d

# Verificar servicios
docker-compose ps
```

## Documentación Técnica

Para información técnica detallada, consulta la documentación en la carpeta `docs/`:

- **Arquitectura**: `docs/arquitectura.md` - Diseño del sistema y componentes
- **AWS API Gateway**: `docs/aws-api-gateway.md` - Configuración y despliegue
- **Monitoreo**: `docs/monitoreo.md` - Stack de observabilidad
- **CI/CD**: `docs/ci-cd-justification.md` - Pipeline de integración continua
- **ChatOps**: `docs/chatops.md` - Operaciones con Slack
- **Recuperación**: `docs/rollback-recovery-strategies.md` - Estrategias de rollback

*Ver `docs/INDICE.md` para el índice completo de documentación.*

## Servicios Disponibles

### Aplicación Principal
- **PortTrack App**: http://localhost:3000
- **API Gateway (AWS)**: https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
- **Admin Panel**: http://localhost:8080

### Monitoreo y Observabilidad
- **Grafana**: http://localhost:3000 (admin/porttrack_admin)
- **Prometheus**: http://localhost:9090
- **AlertManager**: http://localhost:9092
- **Kibana**: http://localhost:5601
- **Jaeger**: http://localhost:16686

### Bases de Datos
- **PostgreSQL**: localhost:5432
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### Gateway y Proxy
- **Nginx**: http://localhost:80
- **AWS API Gateway**: https://example.execute-api.us-east-1.amazonaws.com/dev

## Características Principales

### 🚢 Gestión de Embarcaciones
- Registro completo de barcos con IMO numbers
- Seguimiento de rutas y operaciones portuarias
- Gestión de carga y descarga
- Monitoreo de estado en tiempo real

### 📊 Monitoreo Completo
- Métricas de aplicación e infraestructura
- Logs centralizados con ELK Stack
- Alertas automáticas por Slack y PagerDuty
- Dashboards personalizados en Grafana

### 🔒 Seguridad Avanzada
- Autenticación Auth0 integrada
- AWS API Gateway con rate limiting y escalabilidad automática
- RBAC y permisos granulares
- Audit logging completo

### 🔄 CI/CD Pipeline
- GitHub Actions con múltiples entornos
- Tests automatizados y análisis de seguridad
- Despliegue automático a Kubernetes
- Rollback automático con health checks

## Configuración

### Variables de Entorno
```bash
# Copiar template
cp env.example .env

# Configurar Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret

# Configurar Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK

# Configurar bases de datos
DB_PASSWORD=your-secure-password
MONGO_PASSWORD=your-secure-password
```

### AWS API Gateway
- **Rate Limiting**: 100 requests/minute por API
- **CORS**: Configurado para desarrollo y producción
- **Authentication**: API key y JWT support
- **Routing**: Múltiples servicios y versiones

## Monitoreo y Alertas

### Métricas Principales
- **Aplicación**: Response time, error rate, throughput
- **Infraestructura**: CPU, memoria, disco, red
- **Bases de Datos**: Conexiones, queries, performance
- **ELK Stack**: Log processing, index performance

### Alertas Configuradas
- **Críticas**: Servicios caídos, bases de datos offline
- **Advertencias**: Uso alto de recursos, latencia alta
- **Informativas**: Despliegues exitosos, métricas de negocio

### Notificaciones
- **Slack**: Canal #porttrack-alerts
- **PagerDuty**: Para incidentes críticos
- **Email**: Para reportes diarios

## Escalabilidad

### Kubernetes
- **Auto-scaling**: Basado en CPU y memoria
- **Load Balancing**: Automático entre pods
- **Resource Limits**: Configurados por servicio
- **Health Checks**: Liveness y readiness probes

### Bases de Datos
- **PostgreSQL**: Connection pooling y replicación
- **MongoDB**: Sharding y replicación
- **Redis**: Cluster mode para alta disponibilidad

## Desarrollo

### Estructura del Proyecto
```
porttrack/
├── .github/workflows/     # CI/CD pipelines
├── k8s/                   # Configuración Kubernetes
├── docs/                  # Documentación técnica
├── scripts/               # Scripts de inicialización
├── aws-api-gateway/      # Configuración AWS API Gateway
├── logstash/              # Pipeline de logs
├── nginx/                 # Configuración reverse proxy
└── docker-compose.yml     # Entorno de desarrollo
```

### Comandos Útiles
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Reiniciar un servicio específico
docker-compose restart porttrack-app

# Ver métricas de Prometheus
curl http://localhost:9091/api/v1/targets

# Verificar estado de Elasticsearch
curl http://localhost:9200/_cluster/health
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Abre un Pull Request

## Licencia

MIT License
