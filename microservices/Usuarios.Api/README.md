# Microservicio de Usuarios

API .NET independiente para las rutas `/api/usuarios`. Reutiliza el controlador, el servicio, los modelos y la autenticación existentes, y consulta las tablas actuales de Supabase; no crea ni migra tablas. `/health/live` verifica el proceso y `/health` ejecuta `SELECT 1` contra PostgreSQL para confirmar la conexión a Supabase.

## Codespaces

El devcontainer habilita Docker privilegiado y, al iniciar, construye y despliega `usuarios-api` en Minikube. El port-forward queda disponible en `5088` y el frontend recibe `VITE_USUARIOS_API_URL` automáticamente. Se necesitan los secretos `VITE_SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` configurados en Codespaces.

Para verificar la configuración del clúster:

```bash
kubectl --context=minikube wait --for=condition=Ready node --all --timeout=120s
kubectl --context=minikube get nodes
kubectl --context=minikube rollout status deployment/usuarios-api --timeout=180s
kubectl --context=minikube get pods -l app=usuarios-api -o wide
kubectl --context=minikube get secret usuarios-secrets
```

En `get pods`, confirma `READY 1/1` y `STATUS Running`. `get secret` muestra el nombre y la cantidad de claves, no sus valores.

Prueba el port-forward y la consulta real a la base de datos:

```bash
curl -i http://127.0.0.1:5088/health
```

La respuesta correcta es HTTP 200 con `{"status":"ok","supabase":"connected"}`. Ese resultado lo devuelve la API solo después de completar `SELECT 1` en Supabase. Si el port-forward se detuvo, vuelve a ejecutarlo y deja esa terminal abierta:

```bash
kubectl --context=minikube port-forward service/usuarios-api 5088:80
```

El comando de arranque del devcontainer también vuelve a asegurar el port-forward cuando se inicia el Codespace.

## Ejecución local

Exporta `SUPABASE_URL` (o `VITE_SUPABASE_URL`) y `SUPABASE_DB_CONNECTION_STRING` en el entorno, y ejecuta:

```bash
ASPNETCORE_URLS=http://0.0.0.0:5088 dotnet run --project microservices/Usuarios.Api
```

La prueba local es `curl -i http://localhost:5088/health`. Para usar la API desde Vite, define `VITE_USUARIOS_API_URL=http://localhost:5088` y reinicia el frontend.

## Docker y Kubernetes

Desde la raíz del repositorio:

```bash
docker build -f microservices/Usuarios.Api/Dockerfile -t usuarios-api:local .
minikube image load usuarios-api:local
```

Antes de aplicar el manifiesto, crea `usuarios-secrets` con las variables `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` sin imprimir sus valores:

```bash
kubectl --context=minikube create secret generic usuarios-secrets \
  --from-literal=SUPABASE_URL="$SUPABASE_URL" \
  --from-literal=SUPABASE_DB_CONNECTION_STRING="$SUPABASE_DB_CONNECTION_STRING" \
  --dry-run=client -o yaml | kubectl --context=minikube apply -f -
kubectl --context=minikube apply -f microservices/Usuarios.Api/k8s/usuarios.yaml
kubectl --context=minikube rollout status deployment/usuarios-api --timeout=180s
kubectl --context=minikube port-forward service/usuarios-api 5088:80
```

El servicio es `ClusterIP`; para acceso desde fuera del clúster se requiere un Ingress o balanceador y una URL HTTPS propia. Los endpoints de usuario mantienen la autenticación JWT de Supabase y los permisos existentes.