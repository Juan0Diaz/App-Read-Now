# Servicio de Libros

Este proyecto ejecuta los endpoints existentes de Libros como una API independiente en el puerto `8080`. Reutiliza el controlador, los DTO, los modelos, el contexto y `LibrosServices` del backend mediante enlaces de compilación; no duplica la lógica ni crea o migra tablas. La persistencia sigue usando Supabase.

## Ejecutar localmente

Configura `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` y ejecuta:

```bash
ASPNETCORE_URLS=http://0.0.0.0:5083 dotnet run --project microservices/Libros.Api
```

Comprueba `http://localhost:5083/health`. Para que el frontend use este servicio, configura `VITE_LIBROS_API_URL=http://localhost:5083` en `.env.local` y reinicia Vite. Si no defines esta variable, las llamadas de Libros conservan el gateway existente de `VITE_API_URL`.

## Desplegar en Kubernetes local

Con Docker y Minikube activos, desde la raíz del repositorio:

```bash
docker build -f microservices/Libros.Api/Dockerfile -t libros-api:local .
minikube image load libros-api:local
```

Crea el Secret sin guardar credenciales en el repositorio:

```bash
read -rsp 'Cadena de conexión de Supabase: ' DB_CONNECTION
echo
kubectl create secret generic libros-secrets \
  --from-literal=SUPABASE_URL="$SUPABASE_URL" \
  --from-literal=SUPABASE_DB_CONNECTION_STRING="$DB_CONNECTION" \
  --dry-run=client -o yaml | kubectl apply -f -
unset DB_CONNECTION
```

Aplica los recursos y reenvía el puerto:

```bash
kubectl apply -f microservices/Libros.Api/k8s/libros.yaml
kubectl rollout status deployment/libros-api
kubectl port-forward service/libros-api 5083:80
```

Configura `VITE_LIBROS_API_URL=http://localhost:5083` para que el frontend apunte al servicio reenviado. Las rutas se mantienen bajo `/api/libros`; las operaciones protegidas conservan la autenticación JWT y los roles existentes.