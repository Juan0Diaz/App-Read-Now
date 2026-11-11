# Microservicio de Préstamos

API .NET independiente para consultar y solicitar préstamos. Conserva el contrato `GET /api/prestamos/mios` y `POST /api/prestamos/{idLibro}` del backend original y consulta las tablas existentes de Supabase a través de PostgreSQL; no crea ni migra tablas. Las rutas requieren un JWT de Supabase y las consultas se limitan al usuario autenticado. `GET /health` es público y confirma que la API está respondiendo; no comprueba la conexión a la base de datos.

## Rutas

- `GET /api/prestamos/mios`: devuelve los préstamos del usuario autenticado, incluyendo los datos del libro.
- `POST /api/prestamos/{idLibro}`: solicita un libro aprobado y disponible. Responde `204` si se crea el préstamo, `404` si el libro no existe y `409` si no está aprobado o disponible.

La API requiere `SUPABASE_DB_CONNECTION_STRING` y `SUPABASE_URL` (o `VITE_SUPABASE_URL` como alternativa). No guardes estos valores en el repositorio.

## Codespaces

El `postStartCommand` ejecuta `.devcontainer/scripts/start-kubernetes-apis.sh`. El script construye y despliega Préstamos en Minikube, actualiza el Secret `prestamos-secrets` y mantiene el port-forward local `5003` hacia `service/prestamos-api:80`. `.devcontainer/scripts/generate-env.sh` genera `VITE_PRESTAMOS_API_URL` con la URL del Gateway y el sufijo `/gateway`.

En `backend/appsettings.json`, YARP enruta `/gateway/api/prestamos/{**catch-all}` al destino `http://127.0.0.1:5003/` y elimina el prefijo `/gateway` antes de reenviar la solicitud.

Para verificar el estado del clúster:

```bash
kubectl --context=minikube wait --for=condition=Ready node --all --timeout=120s
kubectl --context=minikube get nodes
kubectl --context=minikube rollout status deployment/prestamos-api --timeout=180s
kubectl --context=minikube get pods -l app=prestamos-api -o wide
kubectl --context=minikube get secret prestamos-secrets
```

En `get pods`, confirma `READY 1/1` y `STATUS Running`. `get secret` muestra metadatos y cantidad de claves, no sus valores.

Prueba el port-forward:

```bash
curl -i http://127.0.0.1:5003/health
```

La respuesta esperada es HTTP 200 con `{"status":"ok"}`. Si el port-forward no está activo, puedes iniciarlo manualmente y dejarlo corriendo en esa terminal:

```bash
kubectl --context=minikube port-forward service/prestamos-api 5003:80
```

## Ejecución local

Exporta la URL de Supabase y configura la cadena de conexión en el entorno. Puedes introducirla sin mostrarla en la terminal:

```bash
export SUPABASE_URL="${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
: "${SUPABASE_URL:?Define SUPABASE_URL o VITE_SUPABASE_URL}"
read -rsp 'Cadena de conexión de Supabase: ' SUPABASE_DB_CONNECTION_STRING
echo
export SUPABASE_DB_CONNECTION_STRING
ASPNETCORE_URLS=http://0.0.0.0:5003 dotnet run --project microservices/Prestamos.Api
```

Comprueba la API local con `curl -i http://localhost:5003/health`. Para que el frontend use el Gateway local, define `VITE_PRESTAMOS_API_URL=http://localhost:5080/gateway` y reinicia Vite.

## Docker

Desde la raíz del repositorio, construye y ejecuta la imagen. Configura primero `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` como en la sección de ejecución local:

```bash
docker build -f microservices/Prestamos.Api/Dockerfile -t prestamos-api:local .
docker run --rm -p 5003:8080 \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_DB_CONNECTION_STRING="$SUPABASE_DB_CONNECTION_STRING" \
  prestamos-api:local
```

La aplicación escucha dentro del contenedor en `8080`; Docker publica el puerto local `5003`.

## Desplegar en Kubernetes

Desde la raíz del repositorio, inicia Minikube y carga la imagen local:

```bash
minikube start -p minikube --driver=docker
kubectl --context=minikube wait --for=condition=Ready node --all --timeout=120s
docker build -f microservices/Prestamos.Api/Dockerfile -t prestamos-api:local .
minikube -p minikube image load prestamos-api:local
```

Prepara `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` como en la sección de ejecución local. Crea o actualiza el Secret sin imprimir sus valores:

```bash
kubectl --context=minikube create secret generic prestamos-secrets \
  --from-env-file=<(printf 'SUPABASE_URL=%s\nSUPABASE_DB_CONNECTION_STRING=%s\n' \
    "$SUPABASE_URL" "$SUPABASE_DB_CONNECTION_STRING") \
  --dry-run=client -o yaml | kubectl --context=minikube apply -f -
```

Aplica el manifiesto, espera el despliegue y abre el port-forward:

```bash
kubectl --context=minikube apply -f microservices/Prestamos.Api/k8s/prestamos.yaml
kubectl --context=minikube rollout restart deployment/prestamos-api
kubectl --context=minikube rollout status deployment/prestamos-api --timeout=180s
kubectl --context=minikube port-forward service/prestamos-api 5003:80
```

Con el port-forward activo, verifica la API con `curl -i http://127.0.0.1:5003/health`.
