# Arranque del microservicio Favoritos en Kubernetes desde la rama main

Esta guía sirve para arrancar el microservicio de Favoritos en Kubernetes cada vez que abras el Codespace desde la rama `main`, sin dejarlo caído ni sin que el frontend pueda consultar los favoritos.

Si no se ejecuta este proceso, el servicio de Favoritos no quedará activo y al iniciar la aplicación no aparecerán los favoritos.

## 1. Preparar el Codespace

La rama `main` incluye el feature `kubectl-helm-minikube` en `.devcontainer/devcontainer.json`, pero hacer `git pull` o cambiar de rama no instala herramientas dentro de un contenedor ya creado. Después de traer esta configuración a un Codespace existente, reconstruye el contenedor desde VS Code:

1. Abre la paleta con `Ctrl+Shift+P`.
2. Ejecuta **Dev Containers: Rebuild Container** y espera a que termine.
3. Abre una terminal nueva y verifica que las herramientas estén instaladas:

```bash
command -v minikube
command -v kubectl
docker --version
minikube version
kubectl version --client
```

`command -v minikube` debe mostrar una ruta, por ejemplo `/usr/local/bin/minikube`. Si indica que no se encuentra el comando, no ejecutes todavía el bloque de arranque: vuelve a reconstruir el Codespace y revisa **Dev Containers: Show Container Log** si el feature falla.

## 2. Ejecutar el arranque completo del microservicio

Abre una terminal en la raíz del proyecto y ejecuta este bloque:

```bash
cd /workspaces/App-Read-Now && \
minikube start --driver=docker && \
kubectl wait --for=condition=Ready nodes --all --timeout=120s && \
docker build -f microservices/Favoritos.Api/Dockerfile -t favoritos-api:local . && \
minikube image load favoritos-api:local && \
kubectl apply -f microservices/Favoritos.Api/k8s/favoritos.yaml && \
kubectl rollout status deployment/favoritos-api --timeout=180s && \
kubectl wait --for=condition=Ready pod -l app=favoritos-api --timeout=120s
```

### Qué hace este comando

- Arranca Minikube con Docker como driver.
- Espera a que el nodo del clúster esté en estado `Ready`.
- Construye la imagen de la API de Favoritos.
- Carga la imagen dentro de Minikube.
- Aplica el Deployment y el Service de Kubernetes.
- Espera a que el pod quede `Running` y listo para atender tráfico.

Si todo va bien, el microservicio queda levantado en Kubernetes.

## 3. Mantener el puerto del servicio accesible

En otra terminal, ejecuta esto para dejar expuesto el servicio en localhost:5081:

```bash
kubectl port-forward service/favoritos-api 5081:80
```

### Importante

- Esta terminal debe permanecer abierta.
- Si se cierra el `port-forward`, la app ya no podrá consultar al microservicio.
- En ese caso, los favoritos no aparecerán en la aplicación.

## 4. Verificación rápida

Comprueba que el servicio responda:

```bash
curl -i http://localhost:5081/health
```

Debe devolver una respuesta como:

```text
HTTP/1.1 200 OK
{"status":"ok"}
```

## 5. Variable del frontend

Asegúrate de que el frontend tenga esta variable activa:

```bash
VITE_FAVORITOS_API_URL=http://localhost:5081
```

Si esta URL no está disponible porque el microservicio no arrancó o el port-forward no está activo, no se mostrarán los Favoritos en la aplicación.

## 6. Sugerencia para arrancarlo en cada sesión

Si quieres dejarlo preparado cada vez que abras el Codespace, puedes guardar este bloque en un script y ejecutarlo con una sola línea:

```bash
cd /workspaces/App-Read-Now && \
minikube start --driver=docker && \
kubectl wait --for=condition=Ready nodes --all --timeout=120s && \
docker build -f microservices/Favoritos.Api/Dockerfile -t favoritos-api:local . && \
minikube image load favoritos-api:local && \
kubectl apply -f microservices/Favoritos.Api/k8s/favoritos.yaml && \
kubectl rollout status deployment/favoritos-api --timeout=180s && \
kubectl wait --for=condition=Ready pod -l app=favoritos-api --timeout=120s
```

Y luego mantener este puerto abierto en otra terminal:

```bash
kubectl port-forward service/favoritos-api 5081:80
```

Con esto, el microservicio de Favoritos queda listo para funcionar en la rama `main` sin problemas.
