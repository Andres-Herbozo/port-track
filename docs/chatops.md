# PortTrack - ChatOps Simple

## Descripción

Guía básica para la implementación de ChatOps en PortTrack usando Slack.

## Concepto de ChatOps

ChatOps es una práctica que integra herramientas de chat con operaciones de desarrollo y DevOps, permitiendo ejecutar comandos y recibir notificaciones directamente desde Slack.

## Implementación Básica

### Herramientas Utilizadas
- **Slack**: Plataforma de comunicación
- **Webhooks**: Notificaciones automáticas
- **GitHub Actions**: Integración con CI/CD

### Configuración Mínima
- Canal de Slack para notificaciones
- Webhook URL configurado
- Integración con GitHub Actions

## Notificaciones Automáticas

### Despliegues
- **Éxito**: Despliegue completado
- **Fallo**: Error en despliegue
- **Canal**: #deployments

### Alertas
- **Críticas**: Aplicación caída
- **Advertencias**: Uso alto de recursos
- **Canal**: #porttrack-alerts

## Configuración

### 1. Crear Webhook en Slack
- Ir a Apps > Incoming Webhooks
- Crear nuevo webhook
- Copiar URL del webhook

### 2. Configurar GitHub Secrets
```yaml
SLACK_WEBHOOK_URL: https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### 3. Configurar GitHub Actions
```yaml
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: success
    channel: '#deployments'
    text: 'PortTrack desplegado exitosamente!'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Comandos Básicos

### Verificar Estado
```bash
# Estado de la aplicación
curl http://localhost:3000/health

# Estado de Prometheus
curl http://localhost:9090/-/healthy

# Estado de Grafana
curl http://localhost:3000/api/health
```

### Logs Básicos
```bash
# Logs de la aplicación
docker logs porttrack-app

# Logs de Prometheus
docker logs porttrack-prometheus

# Logs de Grafana
docker logs porttrack-grafana
```

## Gestión de Incidentes

### Flujo Básico
1. **Detección**: Alerta automática en Slack
2. **Notificación**: Mensaje al canal #porttrack-alerts
3. **Investigación**: Comandos básicos de diagnóstico
4. **Resolución**: Acción manual o automática
5. **Confirmación**: Mensaje de resolución

### Comandos de Diagnóstico
```bash
# Ver pods de Kubernetes
kubectl get pods -n porttrack

# Ver logs de un pod
kubectl logs <pod-name> -n porttrack

# Ver estado de servicios
kubectl get services -n porttrack
```

## Dashboards de ChatOps

### Estado General
- Aplicación: Activa / Caída
- Monitoreo: Funcionando / Error
- Base de datos: Conectada / Desconectada

### Métricas Básicas
- Tiempo de respuesta: < 2s
- Uso de CPU: < 80%
- Uso de memoria: < 80%

## Seguridad

### Acceso
- Solo usuarios autorizados del equipo
- Canal privado para operaciones sensibles
- Logs de todas las acciones

### Permisos
- Lectura: Todo el equipo
- Escritura: Solo DevOps
- Comandos: Solo administradores

## Inicio Rápido

### 1. Configurar Slack
- Crear canal #porttrack-alerts
- Crear canal #deployments
- Configurar webhook

### 2. Configurar GitHub
- Agregar secret SLACK_WEBHOOK_URL
- Verificar integración

### 3. Probar notificaciones
- Hacer commit a main
- Verificar mensaje en Slack

## Recursos Adicionales

- [Slack API Documentation](https://api.slack.com/)
- [GitHub Actions Slack Integration](https://github.com/8398a7/action-slack)
- [ChatOps Best Practices](https://www.atlassian.com/incident-management/devops/chatops)
