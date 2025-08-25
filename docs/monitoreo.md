# PortTrack - Monitoreo Básico

## Descripción

Guía básica para el monitoreo y observabilidad de la plataforma PortTrack.

## Stack de Monitoreo

### Prometheus
- **Propósito**: Recolección de métricas
- **Puerto**: 9090
- **Configuración**: Básica con targets principales

### Grafana
- **Propósito**: Visualización y dashboards
- **Puerto**: 3000
- **Usuario**: admin / porttrack_admin

## Métricas Principales

### Aplicación PortTrack
- **Estado**: up/down
- **Tiempo de respuesta**: http_request_duration_seconds
- **Requests por segundo**: http_requests_total

### AWS API Gateway
- **Estado**: up/down
- **Latencia**: API Gateway response time
- **Errores**: 4xx/5xx error rates
- **Requests**: Total de requests por minuto

### Infraestructura
- **CPU**: Uso por nodo
- **Memoria**: Uso por nodo
- **Estado de nodos**: up/down

## Dashboards Disponibles

### PortTrack Overview
- Estado general de la aplicación
- Métricas básicas de rendimiento
- Gráficos de tiempo de respuesta

### AWS API Gateway
- Estado del API Gateway
- Métricas de latencia y errores
- Rate limiting y uso

### Infraestructura
- Uso de CPU y memoria
- Estado de nodos Kubernetes
- Métricas de red básicas

## Sistema de Alertas

### Alertas Críticas
- **PortTrackAppDown**: Aplicación caída
- **NodeDown**: Nodo caído

### Alertas de Advertencia
- **HighResponseTime**: Tiempo de respuesta alto
- **HighCPUUsage**: Uso de CPU alto

### Notificaciones
- **Slack**: Canal #porttrack-alerts
- **Formato**: Mensaje simple con resumen

## Configuración

### Prometheus
```yaml
global:
  scrape_interval: 30s
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'porttrack-app'
    kubernetes_sd_configs:
      - role: pod
```

### Reglas de Alertas
```yaml
- alert: PortTrackAppDown
  expr: up{job="porttrack-app"} == 0
  for: 1m
  labels:
    severity: critical
```

## Inicio Rápido

### 1. Levantar servicios
```bash
docker-compose up -d
```

### 2. Acceder a Prometheus
```
http://localhost:9090
```

### 3. Acceder a Grafana
```
http://localhost:3000
Usuario: admin
Contraseña: porttrack_admin
```

### 4. Configurar datasource
- Tipo: Prometheus
- URL: http://porttrack-prometheus:9090

## Comandos Útiles

### Ver métricas de la aplicación
```bash
curl http://localhost:9090/metrics
```

### Verificar estado de Prometheus
```bash
curl http://localhost:9090/-/healthy
```

### Verificar estado de Grafana
```bash
curl http://localhost:3000/api/health
```

## Mantenimiento

### Limpieza de datos
- **Prometheus**: 15 días de retención
- **Grafana**: Configuración persistente

### Backup
- **Volúmenes Docker**: Datos persistentes
- **Configuraciones**: En archivos YAML

## Recursos Adicionales

- [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/)
- [Grafana Dashboard Examples](https://grafana.com/grafana/dashboards/)
- [Kubernetes Monitoring](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-usage-monitoring/)
