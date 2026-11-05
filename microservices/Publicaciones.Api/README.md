# Microservicio de Publicaciones

API independiente que mantiene las rutas `/api/publicaciones` y consulta las tablas existentes de Supabase mediante PostgreSQL. No crea ni migra tablas. La lectura general y `/health` son públicos; las operaciones del publicador requieren un JWT de Supabase y validan el rol de negocio en la base de datos.

## Codespaces

Al iniciar el Codespace, `.devcontainer/scripts/start-kubernetes-apis.sh` construye la imagen, despliega `publicaciones-api` en Minikube y mantiene un port-forward en `5085`. El devcontainer expone ese puerto y genera `VITE_PUBLICACIONES_API_URL` automáticamente. Los secretos de Codespaces `VITE_SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` deben estar configurados.

Para verificar la API, abre la URL reenviada del puerto `5085` en `/health`. El frontend usa esa misma URL para sus llamadas a Publicaciones.

## Ejecutar localmente

Configura `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` en el entorno y ejecuta:

```bash
ASPNETCORE_URLS=http://0.0.0.0:5085 dotnet run --project microservices/Publicaciones.Api
```

La comprobación de salud local es `curl -i http://localhost:5085/health`. Para que Vite la use, define `VITE_PUBLICACIONES_API_URL=http://localhost:5085` en `.env.local`.

## GitHub Pages

GitHub Pages es un sitio estático y no puede acceder al Minikube privado ni a un port-forward efímero de Codespaces. Para usar Publicaciones desde `https://juan0diaz.github.io/App-Read-Now/`, despliega esta imagen en un clúster alcanzable públicamente, configura DNS y HTTPS para su API y expón el Service mediante el Ingress o balanceador de ese clúster. La instancia debe recibir `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING` desde un Secret de Kubernetes.

En GitHub, agrega la variable de Actions `VITE_PUBLICACIONES_API_URL` con la URL base HTTPS de esa API, sin `/api/publicaciones` al final. El workflow de Pages la inyecta al compilar y falla explícitamente si falta. El servicio permite CORS desde `juan0diaz.github.io` y desde los dominios reenviados de Codespaces.

El manifiesto `k8s/publicaciones.yaml` crea un Service `ClusterIP`, adecuado para Minikube y comunicación dentro del clúster. La publicación externa, el certificado TLS y el nombre DNS dependen del proveedor Kubernetes elegido; no se debe apuntar Pages a una URL `localhost` ni a una URL `*.app.github.dev` temporal.

## Construir y desplegar

Desde la raíz del repositorio:

```bash
docker build -f microservices/Publicaciones.Api/Dockerfile -t publicaciones-api:local .
```

En Minikube, carga la imagen y aplica el manifiesto:

```bash
minikube image load publicaciones-api:local
kubectl apply -f microservices/Publicaciones.Api/k8s/publicaciones.yaml
kubectl rollout status deployment/publicaciones-api
kubectl port-forward service/publicaciones-api 5085:80
```

Antes de aplicar el manifiesto, crea el Secret `publicaciones-secrets` con las claves `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING`. Para un clúster remoto, publica la imagen en un registry accesible por el clúster y actualiza la referencia de imagen del Deployment.