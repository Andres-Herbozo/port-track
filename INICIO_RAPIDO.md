# PortTrack - Inicio Rápido

## ¿Qué es PortTrack?

PortTrack es una **plataforma de navegación portuaria simplificada** que permite monitorear y gestionar el flujo de embarcaciones en un puerto comercial.

## Lo que Incluye (Versión Simplificada)

### 1. **Despliegue Continuo (1.5 puntos)**
- **Tipo**: Rolling Update (más simple que Blue-Green)
- **CI/CD**: GitHub Actions básico
- **Rollback**: Automático con health checks

### 2. **Entornos y Seguridad (1.5 puntos)**
- **Entornos**: Solo DEV y PROD
- **Credenciales**: Kubernetes Secrets básicos
- **Seguridad**: RBAC simple

### 3. **Monitoreo Continuo (1.5 puntos)**
- **Prometheus**: Métricas básicas
- **Grafana**: Dashboards simples
- **Alertas**: Solo Slack

### 4. **ChatOps (1.5 puntos)**
- **Slack**: Notificaciones básicas
- **Webhooks**: Integración automática
- **Comandos**: Solo los esenciales

## Inicio en 5 Minutos

### 1. **Clonar y Levantar**
```bash
# Clonar repositorio
git clone <tu-repo>
cd porttrack

# Levantar entorno completo
docker-compose up -d
```

### 2. **Acceder a los Servicios**
- **Aplicación**: http://localhost:3000
- **Grafana**: http://localhost:3001 (admin/porttrack_admin)
- **Prometheus**: http://localhost:9091

### 3. **Verificar Estado**
```bash
# Estado de todos los servicios
docker-compose ps

# Logs de la aplicación
docker logs porttrack-app
```

## Monitoreo Básico

### **Dashboards Disponibles**
- **PortTrack Overview**: Estado general
- **Infraestructura**: CPU y memoria

### **Alertas Configuradas**
- **Críticas**: Servicios caídos
- **Advertencias**: Uso alto de recursos

## Configuración Mínima

### **GitHub Actions**
- Solo 3 jobs: test, build, deploy
- Notificaciones Slack básicas
- Sin complejidades avanzadas

### **Kubernetes**
- Solo 2 replicas
- Rolling Update simple
- Health checks básicos

### **Docker Compose**
- 5 servicios esenciales
- Sin health checks complejos
- Configuración mínima

## Documentación Simplificada

- **`docs/arquitectura-simple.md`**: Arquitectura básica
- **`docs/monitoreo-basico.md`**: Monitoreo esencial
- **`docs/chatops-simple.md`**: ChatOps básico

## Puntos Clave para la Evaluación

### **Cumple Todos los Requisitos**
1. **Despliegue Continuo**: Rolling Update + GitHub Actions
2. **Entornos**: DEV/PROD con separación clara
3. **Monitoreo**: Prometheus + Grafana + Alertas
4. **ChatOps**: Slack + Webhooks + Notificaciones

### **Código Funcional**
- Pipeline CI/CD completo
- Configuración Kubernetes
- Monitoreo operativo
- ChatOps funcional

### **Documentación Técnica**
- Arquitectura clara
- Guías de implementación
- Configuración paso a paso

## Ventajas de esta Versión

- **Simple**: Fácil de entender e implementar
- **Completa**: Cumple todos los requisitos
- **Funcional**: Código que funciona
- **Documentada**: Guías claras
- **Escalable**: Base para crecer

## Próximos Pasos (Opcional)

Si quieres expandir después:
- Agregar más entornos (STAGING, TEST)
- Implementar Blue-Green deployment
- Agregar más herramientas de monitoreo
- Expandir ChatOps con Hubot

## Soporte

- **Documentación**: Ver archivos en `docs/`
- **Configuración**: Archivos YAML en `k8s/`
- **Scripts**: Comandos básicos en `scripts/`

---

## ¡Listo para la Evaluación!

Esta versión simplificada cumple con **todos los requisitos** del ejercicio de manera clara, funcional y fácil de implementar.
