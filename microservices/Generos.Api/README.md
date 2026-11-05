# Servicio local de Géneros

Este proyecto ejecuta Géneros como una API independiente en `http://localhost:5082`. Comparte las tablas existentes de Supabase; no crea ni migra tablas.

## Ejecutar la API

Configura en la terminal `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` con los valores de tu proyecto Supabase y ejecuta:

```bash
ASPNETCORE_URLS=http://0.0.0.0:5082 dotnet run --project microservices/Generos.Api
```

En Codespaces, el puerto `5082` se reenvía automáticamente. Para probar salud, abre `/health` en la URL reenviada.

## Conectar el frontend

En un entorno local, configura `VITE_GENEROS_API_URL=http://localhost:5082` en `.env.local` y reinicia Vite. El devcontainer genera esta URL automáticamente y Géneros usa el port-forward de Kubernetes en `5082`. Si no defines esta variable, el frontend conserva el gateway actual configurado en `VITE_API_URL`.

La lectura de géneros es pública. Crear y eliminar requieren un JWT de Supabase cuyo usuario tenga el rol de negocio `Administrador`.

## Desplegar en Kubernetes local

Después de reconstruir el devcontainer e iniciar Minikube, desde la raíz del repositorio:

```bash
docker build -f microservices/Generos.Api/Dockerfile -t generos-api:local .
minikube image load generos-api:local
```

Crea el Secret con las variables de entorno de Supabase, sin guardar credenciales en el repositorio:

```bash
read -rsp 'Cadena de conexión de Supabase: ' DB_CONNECTION
echo
kubectl create secret generic generos-secrets \
	--from-literal=SUPABASE_URL="$SUPABASE_URL" \
	--from-literal=SUPABASE_DB_CONNECTION_STRING="$DB_CONNECTION" \
	--dry-run=client -o yaml | kubectl apply -f -
unset DB_CONNECTION
```

Aplica los recursos y espera el rollout:

```bash
kubectl apply -f microservices/Generos.Api/k8s/generos.yaml
kubectl rollout status deployment/generos-api
kubectl port-forward service/generos-api 5082:80
```

Para probar desde Vite en la misma máquina, configura `VITE_GENEROS_API_URL=http://localhost:5082`. En Codespaces, usa la URL reenviada del puerto `5082`.