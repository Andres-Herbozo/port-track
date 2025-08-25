# PortTrack - Estrategias de Rollback y Recuperación

## **Estrategias de Rollback**

### **1. Rollback Automático (Health Check Based)**

#### **Implementación:**
```yaml
# En Kubernetes deployment
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  minReadySeconds: 30
  progressDeadlineSeconds: 600
```

#### **Triggers Automáticos:**
- **Health Check Fallido**: Después de 3 intentos fallidos
- **Liveness Probe**: Si la aplicación no responde en 30 segundos
- **Readiness Probe**: Si la aplicación no está lista en 5 segundos
- **Startup Probe**: Si la aplicación no inicia en 40 segundos

#### **Proceso de Rollback:**
1. **Detección**: Health check falla consecutivamente
2. **Pausa**: Se detiene el despliegue de nuevos pods
3. **Rollback**: Se revierte a la versión anterior automáticamente
4. **Notificación**: Slack + PagerDuty para el equipo

### **2. Rollback Manual (Comando kubectl)**

#### **Comandos de Rollback:**
```bash
# Ver historial de despliegues
kubectl rollout history deployment/porttrack-app -n porttrack

# Rollback a la versión anterior
kubectl rollout undo deployment/porttrack-app -n porttrack

# Rollback a una versión específica
kubectl rollout undo deployment/porttrack-app -n porttrack --to-revision=2

# Verificar estado del rollback
kubectl rollout status deployment/porttrack-app -n porttrack
```

#### **Script de Rollback Automatizado:**
```bash
#!/bin/bash
# scripts/rollback.sh

NAMESPACE="porttrack"
DEPLOYMENT="porttrack-app"
SLACK_WEBHOOK="YOUR_SLACK_WEBHOOK"

echo "Iniciando rollback manual para $DEPLOYMENT..."

# Verificar estado actual
CURRENT_STATUS=$(kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=30s)

if [ $? -eq 0 ]; then
    echo "Aplicación está funcionando correctamente"
    exit 0
fi

echo "Aplicación tiene problemas, iniciando rollback..."

# Ejecutar rollback
kubectl rollout undo deployment/$DEPLOYMENT -n $NAMESPACE

# Esperar a que se complete
kubectl rollout status deployment/$DEPLOYMENT -n $NAMESPACE --timeout=300s

if [ $? -eq 0 ]; then
    echo "Rollback completado exitosamente"
    # Notificar a Slack
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Rollback manual completado para $DEPLOYMENT\"}" \
        $SLACK_WEBHOOK
else
    echo "Rollback falló"
    # Notificar a Slack
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Rollback manual falló para $DEPLOYMENT\"}" \
        $SLACK_WEBHOOK
    exit 1
fi
```

### **3. Rollback Blue-Green (Para Producción)**

#### **Implementación:**
```bash
#!/bin/bash
# scripts/blue-green-rollback.sh

ENVIRONMENT=$1
CURRENT_COLOR=$(kubectl get svc -n $ENVIRONMENT -l app=porttrack-app -o jsonpath='{.items[0].metadata.labels.color}')

if [ "$CURRENT_COLOR" = "blue" ]; then
    TARGET_COLOR="green"
    TARGET_SERVICE="porttrack-app-green"
else
    TARGET_COLOR="blue"
    TARGET_SERVICE="porttrack-app-blue"
fi

echo "Ejecutando rollback Blue-Green a $TARGET_COLOR..."

# Cambiar tráfico al servicio alternativo
kubectl patch svc porttrack-app-service -n $ENVIRONMENT \
    -p "{\"spec\":{\"selector\":{\"color\":\"$TARGET_COLOR\"}}}"

# Verificar que el cambio fue exitoso
kubectl rollout status deployment/$TARGET_SERVICE -n $ENVIRONMENT --timeout=300s

if [ $? -eq 0 ]; then
    echo "Rollback Blue-Green completado exitosamente"
    # Notificar a Slack
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Rollback Blue-Green completado en $ENVIRONMENT\"}" \
        $SLACK_WEBHOOK
else
    echo "Rollback Blue-Green falló"
    exit 1
fi
```

## 🆘 **Estrategias de Recuperación ante Fallos**

### **1. Recuperación de Base de Datos**

#### **PostgreSQL Recovery:**
```bash
#!/bin/bash
# scripts/db-recovery.sh

DB_NAME="porttrack"
BACKUP_PATH="/backups"
RECOVERY_LOG="/var/log/db-recovery.log"

echo "Iniciando recuperación de base de datos..."

# Verificar si hay backups disponibles
if [ ! -f "$BACKUP_PATH/latest.sql" ]; then
    echo "No hay backups disponibles"
    exit 1
fi

# Detener la aplicación
kubectl scale deployment porttrack-app -n porttrack --replicas=0

# Restaurar desde backup
pg_restore -h localhost -U porttrack_user -d $DB_NAME \
    --clean --if-exists --verbose \
    $BACKUP_PATH/latest.sql > $RECOVERY_LOG 2>&1

if [ $? -eq 0 ]; then
    echo "Base de datos restaurada exitosamente"
    
    # Reiniciar la aplicación
    kubectl scale deployment porttrack-app -n porttrack --replicas=3
    
    # Verificar que la aplicación esté funcionando
    kubectl rollout status deployment/porttrack-app -n porttrack --timeout=300s
    
    if [ $? -eq 0 ]; then
        echo "Aplicación recuperada exitosamente"
        # Notificar a Slack
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"Recuperación de base de datos completada\"}" \
            $SLACK_WEBHOOK
    else
        echo "La aplicación no se recuperó correctamente"
        exit 1
    fi
else
    echo "Fallo en la restauración de la base de datos"
    exit 1
fi
```

#### **MongoDB Recovery:**
```bash
#!/bin/bash
# scripts/mongo-recovery.sh

MONGO_DB="porttrack_nosql"
BACKUP_PATH="/backups/mongo"
RECOVERY_LOG="/var/log/mongo-recovery.log"

echo "Iniciando recuperación de MongoDB..."

# Restaurar desde backup
mongorestore --host localhost --port 27017 \
    --db $MONGO_DB \
    --drop \
    $BACKUP_PATH/$MONGO_DB > $RECOVERY_LOG 2>&1

if [ $? -eq 0 ]; then
    echo "MongoDB restaurado exitosamente"
    # Notificar a Slack
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"Recuperación de MongoDB completada\"}" \
        $SLACK_WEBHOOK
else
    echo "Fallo en la restauración de MongoDB"
    exit 1
fi
```

### **2. Recuperación de Infraestructura**

#### **Kubernetes Cluster Recovery:**
```bash
#!/bin/bash
# scripts/cluster-recovery.sh

echo "Iniciando recuperación del cluster Kubernetes..."

# Verificar estado del cluster
kubectl cluster-info
if [ $? -ne 0 ]; then
    echo "Cluster no está accesible"
    
    # Intentar reiniciar servicios críticos
    echo "Reiniciando servicios críticos..."
    
    # Reiniciar kubelet en todos los nodos
    for node in $(kubectl get nodes -o jsonpath='{.items[*].metadata.name}'); do
        ssh $node "sudo systemctl restart kubelet"
    done
    
    # Esperar a que el cluster se recupere
    sleep 60
    
    # Verificar nuevamente
    kubectl cluster-info
    if [ $? -eq 0 ]; then
        echo "Cluster recuperado exitosamente"
    else
        echo "Cluster no se pudo recuperar"
        exit 1
    fi
fi

# Verificar y restaurar deployments críticos
kubectl get deployments -n porttrack
if [ $? -ne 0 ]; then
    echo "Restaurando deployments críticos..."
    kubectl apply -f k8s/base/
fi
```

### **3. Recuperación de Monitoreo**

#### **Prometheus Recovery:**
```bash
#!/bin/bash
# scripts/monitoring-recovery.sh

echo "Iniciando recuperación del sistema de monitoreo..."

# Verificar estado de Prometheus
curl -f http://localhost:9091/-/healthy
if [ $? -ne 0 ]; then
    echo "Prometheus no está funcionando"
    
    # Reiniciar Prometheus
    kubectl rollout restart deployment porttrack-prometheus -n porttrack-monitoring
    
    # Esperar a que se recupere
    kubectl rollout status deployment porttrack-prometheus -n porttrack-monitoring --timeout=300s
    
    if [ $? -eq 0 ]; then
        echo "Prometheus recuperado exitosamente"
    else
        echo "Prometheus no se pudo recuperar"
        exit 1
    fi
fi

# Verificar estado de Grafana
curl -f http://localhost:3001/api/health
if [ $? -ne 0 ]; then
    echo "Grafana no está funcionando"
    
    # Reiniciar Grafana
    kubectl rollout restart deployment porttrack-grafana -n porttrack-monitoring
    
    # Esperar a que se recupere
    kubectl rollout status deployment porttrack-grafana -n porttrack-monitoring --timeout=300s
    
    if [ $? -eq 0 ]; then
        echo "Grafana recuperado exitosamente"
    else
        echo "Grafana no se pudo recuperar"
        exit 1
    fi
fi
```

## **Procedimientos de Recuperación**

### **1. Procedimiento de Incidente Crítico**

#### **Paso 1: Evaluación Inmediata**
```bash
# Verificar estado general del sistema
./scripts/health-check.sh

# Identificar el componente fallido
kubectl get pods -A --field-selector=status.phase!=Running
```

#### **Paso 2: Aislamiento del Problema**
```bash
# Aislar el componente problemático
kubectl cordon <node-problematico>

# Evacuar pods del nodo
kubectl drain <node-problematico> --ignore-daemonsets --delete-emptydir-data
```

#### **Paso 3: Recuperación**
```bash
# Ejecutar script de recuperación apropiado
if [ "$COMPONENT" = "database" ]; then
    ./scripts/db-recovery.sh
elif [ "$COMPONENT" = "monitoring" ]; then
    ./scripts/monitoring-recovery.sh
elif [ "$COMPONENT" = "cluster" ]; then
    ./scripts/cluster-recovery.sh
fi
```

#### **Paso 4: Validación**
```bash
# Verificar que la recuperación fue exitosa
./scripts/health-check.sh

# Ejecutar tests de smoke
./scripts/smoke-tests.sh
```

### **2. Procedimiento de Rollback de Emergencia**

#### **Escenario: Despliegue Fallido en Producción**

```bash
#!/bin/bash
# scripts/emergency-rollback.sh

echo "INICIANDO ROLLBACK DE EMERGENCIA..."

# 1. Detener inmediatamente el despliegue
kubectl rollout pause deployment/porttrack-app -n porttrack

# 2. Ejecutar rollback automático
kubectl rollout undo deployment/porttrack-app -n porttrack

# 3. Verificar que el rollback se complete
kubectl rollout status deployment/porttrack-app -n porttrack --timeout=300s

if [ $? -eq 0 ]; then
    echo "Rollback de emergencia completado"
    
    # 4. Notificar al equipo
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"ROLLBACK DE EMERGENCIA COMPLETADO\"}" \
        $SLACK_WEBHOOK
    
    # 5. Ejecutar health checks
    ./scripts/health-checks.sh production
    
else
    echo "Rollback de emergencia falló"
    
    # 6. Notificar fallo crítico
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"ROLLBACK DE EMERGENCIA FALLÓ - INTERVENCIÓN MANUAL REQUERIDA\"}" \
        $SLACK_WEBHOOK
    
    exit 1
fi
```

## **Configuración de Monitoreo para Recuperación**

### **Alertas de Recuperación:**
```yaml
# En prometheus-rules.yaml
- alert: RecoveryInProgress
  expr: up{job="porttrack-app"} == 0 and up{job="porttrack-app"} == 1
  for: 30s
  labels:
    severity: warning
    team: porttrack
  annotations:
    summary: "Recovery in progress"
    description: "PortTrack application is recovering from failure"
```

### **Dashboards de Recuperación:**
- **Recovery Status**: Estado de todos los componentes
- **Rollback History**: Historial de rollbacks ejecutados
- **Incident Timeline**: Timeline de incidentes y recuperaciones

## **Documentación de Runbooks**

### **Runbook: Rollback Automático**
1. **Trigger**: Health check falla 3 veces consecutivamente
2. **Acción**: Sistema ejecuta rollback automáticamente
3. **Verificación**: Health checks pasan exitosamente
4. **Notificación**: Slack + PagerDuty para el equipo

### **Runbook: Rollback Manual**
1. **Trigger**: Comando manual del equipo
2. **Acción**: Ejecutar script de rollback
3. **Verificación**: Validar estado de la aplicación
4. **Notificación**: Confirmar rollback exitoso

### **Runbook: Recuperación de Base de Datos**
1. **Trigger**: Base de datos no responde
2. **Acción**: Restaurar desde backup más reciente
3. **Verificación**: Tests de conectividad y queries
4. **Notificación**: Confirmar recuperación exitosa

## **Próximos Pasos**

1. **Implementar scripts de rollback** en el pipeline CI/CD
2. **Configurar alertas de recuperación** en Prometheus
3. **Crear dashboards de recuperación** en Grafana
4. **Documentar runbooks** para el equipo de operaciones
5. **Realizar drills de recuperación** regularmente
