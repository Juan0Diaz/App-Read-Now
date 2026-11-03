# Servicio independiente de Favoritos

La API conserva el contrato de `/api/favoritos` y consulta las tablas existentes de Supabase a través de PostgreSQL. No crea ni migra tablas. Las rutas de datos requieren un JWT de Supabase; `/health` es público.

## Ejecutar localmente

Configura `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` en el entorno y arranca en el puerto `5081`:

```bash
export SUPABASE_URL='https://<project-ref>.supabase.co'
read -rsp 'Cadena de conexión de Supabase: ' SUPABASE_DB_CONNECTION_STRING
echo
export SUPABASE_DB_CONNECTION_STRING
ASPNETCORE_URLS=http://0.0.0.0:5081 dotnet run --project microservices/Favoritos.Api
```

La comprobación de salud local es `curl -i http://localhost:5081/health`. Para el frontend, define `VITE_FAVORITOS_API_URL=http://localhost:5081` en `.env.local` y reinicia Vite. El generador de `.env` del devcontainer configura automáticamente la URL del puerto reenviado en Codespaces.

## Docker

```bash
docker build -f microservices/Favoritos.Api/Dockerfile -t favoritos-api:local .
docker run --rm -p 5081:8080 \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_DB_CONNECTION_STRING="$SUPABASE_DB_CONNECTION_STRING" \
  favoritos-api:local
```

## Desplegar en Kubernetes

Después de reconstruir el devcontainer, desde la raíz del repositorio inicia Minikube con Docker y construye/carga la imagen:

```bash
minikube start --driver=docker
kubectl wait --for=condition=Ready nodes --all --timeout=120s
docker build -f microservices/Favoritos.Api/Dockerfile -t favoritos-api:local .
minikube image load favoritos-api:local
```

Crea el Secret en el clúster sin escribir credenciales en los manifiestos:

```bash
SUPABASE_URL="${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
: "${SUPABASE_URL:?Define SUPABASE_URL o VITE_SUPABASE_URL}"
read -rsp 'Cadena de conexión de Supabase: ' DB_CONNECTION
echo
kubectl create secret generic favoritos-secrets \
  --from-literal=SUPABASE_URL="$SUPABASE_URL" \
  --from-literal=SUPABASE_DB_CONNECTION_STRING="$DB_CONNECTION" \
  --dry-run=client -o yaml | kubectl apply -f -
unset DB_CONNECTION
```

Aplica la API, espera el Pod y confirma el nodo, el Secret, el estado `1/1` y la salud:

```bash
kubectl apply -f microservices/Favoritos.Api/k8s/favoritos.yaml
kubectl rollout status deployment/favoritos-api
kubectl wait --for=condition=Ready nodes --all --timeout=120s
kubectl get nodes
kubectl get secret favoritos-secrets
kubectl get service favoritos-api
kubectl get pods -l app=favoritos-api -o wide
kubectl port-forward service/favoritos-api 5081:80
```

El port-forward debe permanecer activo en esa terminal. Si se detiene, vuelve a ejecutar `kubectl port-forward service/favoritos-api 5081:80`. En otra terminal, comprueba que Kubernetes enruta a la API:

```bash
curl -i http://localhost:5081/health
```

Para verificar la consulta real a Supabase, usa un `access_token` vigente de una sesión autenticada de la aplicación. La respuesta debe ser un arreglo JSON con los favoritos de ese usuario (vacío si aún no tiene):

```bash
read -rsp 'Access token de Supabase: ' SUPABASE_ACCESS_TOKEN
echo
curl -fsS http://localhost:5081/api/favoritos \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
unset SUPABASE_ACCESS_TOKEN
```

Una respuesta `200` con JSON confirma autenticación, conexión a PostgreSQL/Supabase y lectura de los favoritos asociados al `sub` del token. No compartas ni guardes el token en el repositorio.

## Reconstruir el devcontainer

El devcontainer habilita `privileged` y Docker-in-Docker para construir imágenes y usar Kubernetes local. En VS Code abre la paleta con `Ctrl+Shift+P` y ejecuta **Dev Containers: Rebuild Container**. La reconstrucción debe iniciarse desde la interfaz de VS Code/Codespaces; esta API no puede ejecutar el comando de la paleta por ti.