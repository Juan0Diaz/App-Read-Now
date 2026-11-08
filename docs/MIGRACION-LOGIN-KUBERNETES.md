# Migración de Login a Kubernetes

Login conserva la autenticación interactiva en el cliente oficial de Supabase para no
alterar OAuth, recuperación de contraseña ni persistencia de sesión. La API autónoma
expone `GET /api/login/me` para consultar el perfil con JWT y `/health` ejecuta
`SELECT 1` contra la base de datos de Supabase. La conexión nunca se incluye en la
imagen ni en los manifiestos.

## Puertos

| Uso | Puerto local | Destino |
| --- | ---: | --- |
| API Login local | 5083 | ASP.NET Core |
| API Login en Kubernetes | 5085 | `login-api` Service, puerto 80 |
| API Libros | 5086 | `libros-api` Service, puerto 80 |

Libros se mueve de 5083 a 5086 para liberar el puerto local solicitado para Login.
En Codespaces, `VITE_LOGIN_API_URL` apunta al puerto Kubernetes 5085; fuera de
Codespaces, apunta a `http://localhost:5083`.

## Configuración y despliegue

Configura en GitHub Codespaces los secretos `VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY` y `SUPABASE_DB_CONNECTION_STRING`. El script de arranque
crea/actualiza `login-secrets`, construye y carga `login-api:local`, aplica el
Deployment y conserva el port-forward. No imprimas ni guardes el valor de la conexión.

Después de cambiar `.devcontainer/devcontainer.json`, abre la paleta con
`Ctrl+Shift+P` y ejecuta **Dev Containers: Rebuild Container**. Al volver a abrir el
Codespace, `postStartCommand` ejecuta el despliegue automáticamente.

Para desplegar o recuperar manualmente:

```bash
bash .devcontainer/scripts/start-kubernetes-apis.sh
```

Para correr la API localmente en 5083, con `SUPABASE_URL` (o `VITE_SUPABASE_URL`) y
`SUPABASE_DB_CONNECTION_STRING` exportadas en la terminal:

```bash
dotnet run --project microservices/Login.Api/Login.Api.csproj
curl -fsS http://localhost:5083/health
```

## Comprobaciones en Kubernetes

Ejecuta estos comandos desde el Codespace después del arranque:

```bash
kubectl --context=minikube wait --for=condition=Ready node --all --timeout=120s
kubectl --context=minikube get nodes
kubectl --context=minikube get secret login-secrets
kubectl --context=minikube get secret login-secrets -o go-template='{{range $key, $value := .data}}{{$key}}{{"\n"}}{{end}}'
kubectl --context=minikube rollout status deployment/login-api --timeout=180s
kubectl --context=minikube get pods -l app=login-api -o wide
kubectl --context=minikube get service/login-api
curl -fsS http://localhost:5085/health
```

El nodo debe indicar `Ready`, el Pod `1/1 Running`, y el Secret debe enumerar las
claves `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING`. La respuesta exitosa de
`/health` es `{"status":"ok","supabase":"connected"}`: ese resultado confirma que
el Pod atendió el `curl` y ejecutó satisfactoriamente `SELECT 1` en Supabase.

El script mantiene el port-forward en segundo plano. Primero comprueba si ya está
activo; no ejecutes otro `port-forward` si este `curl` responde correctamente:

```bash
curl -i --max-time 5 http://localhost:5085/health
```

Si `curl` falla con `connection refused`, revisa si ya hay un proceso reenviando ese
puerto:

```bash
ps -eo pid,args | grep '[k]ubectl .*port-forward service/login-api 5085:80'
```

Si aparece `service/login-api 5085:80`, el forward ya existe; vuelve a probar `curl`
en lugar de iniciar otro. Si no aparece ningún proceso, inicia uno en una terminal y
déjala abierta:

```bash
kubectl --context=minikube port-forward service/login-api 5085:80
```

La salida debe indicar `Forwarding from 127.0.0.1:5085 -> 8080`. Si el comando
responde `bind: address already in use`, hay otro proceso ocupando el puerto. No
inicies más forwards: identifica el listener con `ss -ltnp 'sport = :5085'` y prueba
el health check del servicio existente.

La respuesta `503` indica que la API está viva pero no pudo conectar con Supabase;
revisa los eventos y logs sin imprimir el Secret:

```bash
kubectl --context=minikube describe pod -l app=login-api
kubectl --context=minikube logs deployment/login-api
```

La URL exacta reenviada por Codespaces para el frontend se escribe en `.env` como
`VITE_LOGIN_API_URL` al generar el entorno. Tras modificarla, reinicia Vite.