# Migración de Favoritos a Kubernetes

## Objetivo y resultado

Esta guía registra el proceso completo para separar Favoritos del backend monolítico, ejecutarlo como una API .NET independiente, construir su imagen Docker y desplegarla en Kubernetes local mediante Minikube. También documenta cómo configurar el frontend y verificar que una petición autenticada devuelve los favoritos existentes en Supabase.

El servicio conserva la ruta `GET /api/favoritos`, junto con las operaciones `POST` y `DELETE`, y consulta las tablas ya existentes de Supabase mediante PostgreSQL. No crea ni migra tablas. La API local escucha en el puerto `5081`; dentro del contenedor escucha en `8080`, expuesto por un Service Kubernetes `ClusterIP` en el puerto `80`.

## Arquitectura resultante

| Componente | Responsabilidad |
| --- | --- |
| `microservices/Favoritos.Api` | API ASP.NET Core independiente, autenticación JWT Supabase, controlador y consultas EF Core. |
| Supabase Auth | Emite el `access_token`; la API valida la firma con el JWKS de Supabase y obtiene el identificador de usuario del `sub`. |
| Supabase PostgreSQL | Fuente de datos para Favoritos, Libros y Géneros, usando el esquema existente. |
| Docker | Imagen multi-stage `favoritos-api:local`; el contexto del build es la raíz del repositorio. |
| Kubernetes/Minikube | Deployment de una réplica, probes HTTP, Secret para configuración y Service interno. |
| Frontend | Usa exclusivamente `VITE_FAVORITOS_API_URL`; no consulta el gateway del backend monolítico. |

El flujo de petición queda así:

```text
Frontend -> JWT Supabase -> port-forward :5081 -> Service :80 -> Pod :8080
                                                               |
                                                               +-> Supabase PostgreSQL
```

El endpoint `/health` solo comprueba que el proceso ASP.NET Core responde. No verifica conectividad a PostgreSQL; esa se confirmó mediante la consulta autenticada a `GET /api/favoritos`.

## 1. Crear la API independiente

Se creó `microservices/Favoritos.Api/Favoritos.Api.csproj` como proyecto .NET 8 con EF Core, Npgsql y autenticación JWT. El proyecto enlaza el handler JWT, `AppDbContext` y los modelos compartidos desde `backend/`, lo que evita duplicar el mapeo de las tablas.

`Program.cs` registra PostgreSQL con `SUPABASE_DB_CONNECTION_STRING`, configura la URL de Auth de Supabase, CORS y serialización snake_case, y publica `/health`. `FavoritosController` protege `/api/favoritos` con autorización; extrae `id_usuario` del principal autenticado. `FavoritosServices` consulta solo favoritos de ese usuario, incluye Libro y Género, y conserva las reglas existentes para agregar o quitar.

El contrato relevante es:

| Método | Ruta | Resultado esperado |
| --- | --- | --- |
| GET | `/api/favoritos` | `200` y los favoritos del usuario autenticado, incluyendo Libro y Género. |
| POST | `/api/favoritos/{idLibro}` | `204` si se agrega; `409` si el libro no está aprobado. |
| DELETE | `/api/favoritos/{idLibro}` | `204` si se elimina; `404` si no existe para el usuario. |
| GET | `/health` | `200` con `{"status":"ok"}`; no requiere JWT ni abre una conexión DB. |

Comprobación de compilación realizada:

```bash
dotnet build microservices/Favoritos.Api/Favoritos.Api.csproj
```

Resultado: `Build succeeded`, cero advertencias y cero errores.

## 2. Integrar el frontend

El cliente `src/microservicios/favorites.ts` usa exclusivamente `VITE_FAVORITOS_API_URL` y no hace fallback a `VITE_API_URL`. Así Favoritos solo se carga cuando el microservicio independiente está disponible; si falta la configuración o falla la petición, la interfaz deja la lista vacía.

En entorno local, el valor es:

```dotenv
VITE_FAVORITOS_API_URL=http://localhost:5081
```

El script `.devcontainer/scripts/generate-env.sh` genera automáticamente la URL `5081` reenviada por Codespaces, o usa `localhost` fuera de Codespaces. Tras cambiar variables Vite, hay que reiniciar el servidor frontend.

Validaciones realizadas:

```bash
npm run lint
npm run build
```

Resultado: TypeScript terminó sin errores y Vite completó la compilación de producción.

## 3. Preparar Docker

Se añadió `microservices/Favoritos.Api/Dockerfile` multi-stage. La etapa SDK restaura y publica; la etapa ASP.NET runtime contiene solo el resultado publicado. El puerto interno es `8080`.

El build se debe ejecutar desde la raíz del repositorio porque las rutas `COPY` usan `backend/` y `microservices/`:

```bash
docker build -f microservices/Favoritos.Api/Dockerfile -t favoritos-api:local .
```

Resultado observado: build terminado correctamente y tag `favoritos-api:local` creado.

Prueba opcional de la imagen fuera de Kubernetes:

```bash
docker run --rm -p 5081:8080 \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_DB_CONNECTION_STRING="$SUPABASE_DB_CONNECTION_STRING" \
  favoritos-api:local
```

Desde otra terminal se comprobó:

```bash
curl -i http://localhost:5081/health
```

Resultado: `HTTP/1.1 200 OK` y `{"status":"ok"}`. La prueba de salud no confirma la conexión a la base; esa validación se realiza más adelante con el GET autenticado.

## 4. Preparar el devcontainer

`.devcontainer/devcontainer.json` declara Docker-in-Docker, `privileged: true`, reenvío del puerto `5081`, y el feature `kubectl-helm-minikube`. También restaura el nuevo proyecto .NET al crear el contenedor. Estas herramientas solo se incorporan al entorno después de reconstruirlo.

En VS Code/Codespaces:

1. Abrir la paleta con `Ctrl+Shift+P`.
2. Ejecutar **Dev Containers: Rebuild Container**.
3. Esperar que termine y abrir una terminal nueva.
4. Confirmar las herramientas:

```bash
docker --version
kubectl version --client
minikube version
```

Si `kubectl` o `minikube` indican `command not found`, el contenedor activo no recibió el feature: repetir el rebuild y revisar **Dev Containers: Show Container Log**. Docker disponible por sí solo no confirma que Kubernetes esté instalado.

## 5. Iniciar Minikube y validar el nodo

Desde la raíz del repositorio:

```bash
minikube start --driver=docker
kubectl wait --for=condition=Ready nodes --all --timeout=120s
kubectl get nodes
```

Salida esperada: al menos un nodo, normalmente `minikube`, en estado `Ready`. Esperar a que esté listo antes de aplicar workloads evita confundir un problema de clúster con un error de la API.

## 6. Construir y cargar la imagen en Minikube

```bash
docker build -f microservices/Favoritos.Api/Dockerfile -t favoritos-api:local .
minikube image load favoritos-api:local
docker image inspect favoritos-api:local --format '{{.Id}}'
```

La imagen se carga explícitamente en Minikube porque el runtime del nodo no siempre comparte el almacén local de Docker del Codespace. El manifiesto usa `imagePullPolicy: IfNotPresent` para permitir esa imagen local.

## 7. Configurar el Secret de Supabase

El Deployment requiere dos variables: `SUPABASE_URL` y `SUPABASE_DB_CONNECTION_STRING`. Los valores deben pertenecer al mismo proyecto de Supabase. Se recomienda usar el **Session pooler** cuando la red del Codespace no tenga acceso IPv6 directo.

No se deben guardar credenciales en YAML, en el repositorio ni en el historial del shell. Obtener de Supabase una cadena PostgreSQL nueva, con host, puerto, base de datos, usuario y contraseña actuales. Luego ejecutar en una misma terminal; cuando se solicite la URL, pegar el `Project URL` real de Supabase:

```bash
read -rp 'URL del proyecto Supabase: ' SUPABASE_URL
read -rsp 'Pega la cadena PostgreSQL nueva y presiona Enter: ' DB_CONNECTION
printf '\n'

if [[ -z "$SUPABASE_URL" || -z "$DB_CONNECTION" ]]; then
  echo 'ERROR: URL o cadena vacía; no se actualizará el Secret.'
else
  kubectl create secret generic favoritos-secrets \
    --from-literal=SUPABASE_URL="$SUPABASE_URL" \
    --from-literal=SUPABASE_DB_CONNECTION_STRING="$DB_CONNECTION" \
    --dry-run=client -o yaml | kubectl apply -f -
  unset DB_CONNECTION
fi
```

Al prompt oculto hay que pegar la cadena completa y presionar `Enter`; no se verá en pantalla. El `if` evita crear o conservar accidentalmente una cadena vacía. Para verificar longitud sin revelar el valor:

```bash
printf 'Bytes de la cadena en el Secret: '
kubectl get secret favoritos-secrets \
  -o jsonpath='{.data.SUPABASE_DB_CONNECTION_STRING}' | base64 -d | wc -c
kubectl get secret favoritos-secrets
```

La longitud debe ser mayor que cero. `kubectl get secret` debe mostrar `DATA 2`; no muestra los valores. En el proceso real se detectó una clave con cero bytes, que causaba `The ConnectionString property has not been initialized`; al volver a ingresar una cadena no vacía, la consulta pudo conectarse.

> **Seguridad:** durante la resolución se compartió una contraseña de base de datos en el chat. Debe restablecerse en Supabase y actualizarse el Secret con la nueva contraseña. Nunca registrar contraseñas ni tokens en esta guía o en Git.

## 8. Aplicar los manifiestos

`microservices/Favoritos.Api/k8s/favoritos.yaml` define:

| Recurso | Configuración |
| --- | --- |
| Deployment `favoritos-api` | Una réplica; imagen local `favoritos-api:local`; puerto de contenedor `8080`; configuración tomada de `favoritos-secrets`. |
| Readiness/Liveness probes | GET `/health` en el puerto nombrado `http`. |
| Resources | Requests `100m` CPU y `128Mi`; límites `500m` CPU y `512Mi`. |
| Service `favoritos-api` | `ClusterIP`, puerto `80` dirigido al puerto `8080` del Pod. |

Aplicar y esperar:

```bash
kubectl apply -f microservices/Favoritos.Api/k8s/favoritos.yaml
kubectl rollout status deployment/favoritos-api
kubectl wait --for=condition=Ready pod -l app=favoritos-api --timeout=120s
```

Confirmar recursos y selección del Pod:

```bash
kubectl get nodes
kubectl get secret favoritos-secrets
kubectl get pods -l app=favoritos-api -o wide
kubectl get service favoritos-api
kubectl get endpoints favoritos-api
```

Resultados esperados: nodo `Ready`, Pod `1/1 Running`, Secret con dos claves, Service en `80/TCP`, y endpoint apuntando al IP del Pod en el puerto `8080`. El endpoint observado durante la validación fue `10.244.0.5:8080`.

## 9. Mantener el port-forward

El Service es `ClusterIP`, por lo tanto solo es accesible dentro del clúster. Para probarlo desde Codespaces se usa `kubectl port-forward` en una terminal dedicada:

```bash
kubectl port-forward service/favoritos-api 5081:80
```

La terminal debe permanecer abierta. Salida esperada:

```text
Forwarding from 127.0.0.1:5081 -> 8080
Forwarding from [::1]:5081 -> 8080
```

Si el comando termina o se cierra esa terminal, los `curl` a `localhost:5081` devolverán `curl: (7) Failed to connect`. Volver a ejecutar el comando. Se comprobó que el Service tenía endpoint y que el túnel, una vez activo, respondía correctamente.

Probar salud desde otra terminal:

```bash
curl -i http://localhost:5081/health
```

Resultado observado: `HTTP/1.1 200 OK` y `{"status":"ok"}`.

## 10. Obtener y usar el access token

El endpoint de datos requiere un JWT vigente de una sesión iniciada en la aplicación. Abrir la aplicación frontend en el puerto `3000`, iniciar sesión y abrir DevTools Console en esa misma pestaña. Este código copia el token sin imprimirlo:

```js
(() => {
  const key = Object.keys(localStorage).find(
    item => item.startsWith('sb-') && item.endsWith('-auth-token')
  );
  const session = key ? JSON.parse(localStorage.getItem(key)) : null;
  if (!session?.access_token) {
    console.error('No hay sesión activa en esta pestaña.');
    return;
  }
  copy(session.access_token);
  console.log(`Token copiado (${session.access_token.length} caracteres).`);
})();
```

La palabra `undefined` que pueda aparecer como resultado de `copy()` es normal; el mensaje `Token copiado (...)` confirma el éxito. Si no encuentra una sesión, iniciar sesión en el frontend y repetirlo. No pegar el token en el chat ni guardarlo en un archivo.

En una terminal aparte, pegar el token solo cuando el prompt lo solicite:

```bash
read -rsp 'Pega el access token y presiona Enter: ' SUPABASE_ACCESS_TOKEN
printf '\n'
curl -i http://localhost:5081/api/favoritos \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN"
unset SUPABASE_ACCESS_TOKEN
```

## 11. Verificación funcional observada

La petición autenticada respondió `HTTP/1.1 200 OK` con cuatro favoritos existentes. La respuesta incluyó identificadores, datos de los libros y géneros asociados. Esto confirmó conjuntamente:

1. El `access_token` fue aceptado por la validación JWKS de Supabase.
2. La API obtuvo el ID del usuario autenticado.
3. El Pod cargó la cadena de conexión no vacía desde el Secret.
4. Npgsql conectó a Supabase PostgreSQL y EF Core ejecutó la consulta.
5. El resultado se limitó a los favoritos de ese usuario.

Un arreglo `[]` con `200 OK` también significa que autenticación y consulta funcionan, pero que esa cuenta no tiene favoritos. Un `401` suele indicar token ausente, vencido o inválido. Un `500` requiere consultar logs.

## Diagnóstico rápido

| Síntoma | Causa probable | Comprobación o solución |
| --- | --- | --- |
| `kubectl: command not found` o `minikube: command not found` | No se reconstruyó el devcontainer con el feature Kubernetes. | Ejecutar **Dev Containers: Rebuild Container** y abrir una terminal nueva. |
| `curl: (7) Failed to connect` a `localhost:5081` | Port-forward detenido o ausente. | Mantener abierta `kubectl port-forward service/favoritos-api 5081:80`. |
| `/health` da `200`, pero GET da `500` | La salud del proceso no comprueba PostgreSQL; revisar logs. | `kubectl logs deployment/favoritos-api --since=5m --tail=80`. |
| `The ConnectionString property has not been initialized` | `SUPABASE_DB_CONNECTION_STRING` ausente o vacía. | Comprobar la longitud decodificada del Secret, nunca imprimir su contenido; volver a introducir la cadena y reiniciar el Deployment. |
| GET devuelve `401` | Token no enviado, vencido o de otra sesión. | Iniciar sesión en frontend y copiar un token vigente. |
| GET devuelve `200` y `[]` | La cuenta autenticada no tiene favoritos. | Probar con una cuenta que ya tenga favoritos. |

Para revisar logs sin imprimir configuración sensible:

```bash
kubectl logs deployment/favoritos-api --since=5m --tail=80
```

## Validaciones realizadas

| Comprobación | Resultado |
| --- | --- |
| `dotnet build microservices/Favoritos.Api/Favoritos.Api.csproj` | Correcto; cero advertencias y errores. |
| `npm run lint` | Correcto. |
| `npm run build` | Correcto. |
| `docker build -f microservices/Favoritos.Api/Dockerfile -t favoritos-api:local .` | Correcto; imagen creada. |
| `curl -i http://localhost:5081/health` | `200 OK` local, en contenedor y desde Kubernetes vía port-forward. |
| Kubernetes | Nodo `Ready`, Pod `1/1 Running`, Service con endpoint, Secret con dos claves. |
| GET autenticado `/api/favoritos` | `200 OK`, cuatro favoritos existentes devueltos desde Supabase. |

## Archivos principales

| Archivo | Cambio |
| --- | --- |
| `microservices/Favoritos.Api/Program.cs` | Configuración de DB, JWT, CORS, JSON y `/health`. |
| `microservices/Favoritos.Api/Controllers/FavoritosController.cs` | Endpoints protegidos de Favoritos. |
| `microservices/Favoritos.Api/Services/FavoritosServices.cs` | Consultas y operaciones de Favoritos. |
| `microservices/Favoritos.Api/Dockerfile` | Build multi-stage de la imagen. |
| `microservices/Favoritos.Api/k8s/favoritos.yaml` | Deployment y Service Kubernetes. |
| `src/microservicios/favorites.ts` | Selección de la URL independiente del servicio. |
| `.devcontainer/devcontainer.json` | Docker privilegiado, tooling Kubernetes y puerto 5081. |
| `.devcontainer/scripts/generate-env.sh` | Generación de `VITE_FAVORITOS_API_URL`. |

No se incluyen aquí contraseñas, cadenas de conexión ni tokens. La contraseña divulgada durante el diagnóstico debe haberse restablecido en Supabase y el Secret actualizado.