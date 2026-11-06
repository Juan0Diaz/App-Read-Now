# Arranque automático de las APIs en Kubernetes

Al abrir o reanudar el Codespace, `postStartCommand` ejecuta
`.devcontainer/scripts/start-kubernetes-apis.sh`. El script inicia Minikube, construye
y carga las imágenes locales, actualiza los Secrets, aplica los manifiestos y conserva
los port-forwards en segundo plano.

## Requisitos

Configura en GitHub Codespaces los secretos `VITE_SUPABASE_URL` y
`SUPABASE_DB_CONNECTION_STRING`. El primero se reutiliza como `SUPABASE_URL` dentro de
los servicios. No guardes las credenciales en los manifiestos ni en el repositorio.

Al cambiar la configuración del devcontainer, reconstruye el Codespace una vez con
**Dev Containers: Rebuild Container**. En aperturas posteriores, el arranque es
automático.

## Puertos

| Servicio | Puerto reenviado | Comprobación |
| --- | ---: | --- |
| Backend upstream | 5081 | Lo inicia su perfil de ASP.NET Core |
| Géneros | 5082 | `curl http://localhost:5082/health` |
| Login local | 5083 | `dotnet run --project microservices/Login.Api/Login.Api.csproj` |
| Favoritos (reenvío interno) | 5084 | `curl http://localhost:5084/health` |
| Login (Kubernetes) | 5085 | `curl http://localhost:5085/health` |
| Libros | 5086 | `curl http://localhost:5086/health` |

Favoritos usa `5084` internamente porque `5081` ya pertenece al backend upstream. El
frontend usa el gateway dinámico de Codespaces en `5080`; YARP reenvía Favoritos a
`5084`, por lo que el navegador no depende de publicar ese puerto. Los PID y logs de
los port-forwards Kubernetes se guardan en `~/.cache/app-read-now/`.

## Verificación y recuperación

Comprueba los servicios y la salud de las APIs:

```bash
kubectl --context=minikube get svc favoritos-api generos-api libros-api
curl -fsS http://localhost:5084/health
curl -fsS http://localhost:5082/health
curl -fsS http://localhost:5085/health
curl -fsS http://localhost:5086/health
```

Para repetir manualmente el mismo flujo de recuperación:

```bash
bash .devcontainer/scripts/start-kubernetes-apis.sh
```

Si el despliegue falla, revisa `~/.cache/app-read-now/<servicio>-port-forward.log` y
los logs del pod, por ejemplo `kubectl --context=minikube logs deployment/favoritos-api`.
