#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/../.." && pwd)"
PROFILE="minikube"
CONTEXT="minikube"
PORT_FORWARD_DIR="${HOME}/.cache/app-read-now"

cd "$ROOT_DIR"

SUPABASE_URL="${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
if [[ -z "$SUPABASE_URL" ]]; then
  echo "ERROR: falta SUPABASE_URL o VITE_SUPABASE_URL en los secretos del Codespace."
  exit 1
fi
if [[ -z "${SUPABASE_DB_CONNECTION_STRING:-}" ]]; then
  echo "ERROR: falta el secreto SUPABASE_DB_CONNECTION_STRING en el Codespace."
  exit 1
fi

for required_command in minikube kubectl docker curl ps; do
  if ! command -v "$required_command" >/dev/null 2>&1; then
    echo "ERROR: no se encontró el comando requerido: $required_command"
    exit 1
  fi
done

ensure_secret() {
  local secret_name="$1"

  kubectl --context="$CONTEXT" create secret generic "$secret_name" \
    --from-env-file=<(printf 'SUPABASE_URL=%s\nSUPABASE_DB_CONNECTION_STRING=%s\n' \
      "$SUPABASE_URL" "$SUPABASE_DB_CONNECTION_STRING") \
    --dry-run=client -o yaml | kubectl --context="$CONTEXT" apply -f -
}

deploy_api() {
  local api_name="$1"
  local dockerfile="$2"
  local manifest="$3"
  local secret_name="$4"

  echo "Construyendo y desplegando ${api_name}-api..."
  docker build -f "$dockerfile" -t "${api_name}-api:local" .
  minikube -p "$PROFILE" image load "${api_name}-api:local"
  ensure_secret "$secret_name"
  kubectl --context="$CONTEXT" apply -f "$manifest"
  kubectl --context="$CONTEXT" rollout restart "deployment/${api_name}-api"
  kubectl --context="$CONTEXT" rollout status "deployment/${api_name}-api" --timeout=180s
}

ensure_port_forward() {
  local api_name="$1"
  local local_port="$2"
  local service_name="${api_name}-api"
  local service_url="http://127.0.0.1:${local_port}/health"
  local pid_file="${PORT_FORWARD_DIR}/${api_name}-port-forward.pid"
  local log_file="${PORT_FORWARD_DIR}/${api_name}-port-forward.log"
  local saved_pid=""
  local matching_pid=""
  local conflicting_args=""
  local candidate_pid=""
  local candidate_args=""
  local process_args=""

  if [[ -f "$pid_file" ]]; then
    read -r saved_pid < "$pid_file" || true
    if [[ -n "$saved_pid" ]] && kill -0 "$saved_pid" 2>/dev/null; then
      process_args="$(ps -p "$saved_pid" -o args= 2>/dev/null || true)"
      if [[ "$process_args" == *"port-forward service/${service_name} ${local_port}:80"* ]]; then
        matching_pid="$saved_pid"
      fi
    fi

    if [[ -z "$matching_pid" ]]; then
      rm -f "$pid_file"
    fi
  fi

  while read -r candidate_pid candidate_args; do
    [[ "$candidate_args" == *"kubectl"* ]] || continue
    [[ "$candidate_args" == *"port-forward"* ]] || continue
    [[ "$candidate_args" == *" ${local_port}:80"* ]] || continue

    if [[ "$candidate_args" == *"service/${service_name} ${local_port}:80"* ]]; then
      matching_pid="$candidate_pid"
    else
      conflicting_args="$candidate_args"
    fi
  done < <(ps -eo pid=,args=)

  if [[ -n "$conflicting_args" ]]; then
    echo "ERROR: el puerto ${local_port} ya reenvía otro servicio:"
    echo "       ${conflicting_args}"
    return 1
  fi

  if [[ -n "$matching_pid" ]]; then
    printf '%s\n' "$matching_pid" > "$pid_file"

    if curl -fsS --retry 30 --retry-connrefused --retry-delay 1 --retry-max-time 40 \
      --max-time 2 "$service_url" >/dev/null 2>&1; then
      echo "[OK] ${service_name} está listo: ${service_url}"
      return 0
    fi

    echo "ERROR: el port-forward de ${service_name} existe, pero /health no responde."
    echo "       Revisa el log: ${log_file}"
    return 1
  fi

  if curl -fsS --max-time 2 "$service_url" >/dev/null 2>&1; then
    echo "ERROR: el puerto ${local_port} responde, pero no pertenece al port-forward esperado de ${service_name}."
    echo "       Revisa el proceso que ocupa el puerto antes de continuar."
    return 1
  fi

  nohup kubectl --context="$CONTEXT" port-forward \
    "service/${service_name}" "${local_port}:80" \
    >"$log_file" 2>&1 </dev/null &
  matching_pid="$!"
  printf '%s\n' "$matching_pid" > "$pid_file"

  if ! curl -fsS --retry 30 --retry-connrefused --retry-delay 1 --retry-max-time 40 \
    --max-time 2 "$service_url" >/dev/null 2>&1; then
    echo "ERROR: ${service_name} no respondió en el puerto ${local_port}. Log: ${log_file}"
    if [[ -f "$log_file" ]]; then
      cat "$log_file"
    fi
    return 1
  fi

  process_args="$(ps -p "$matching_pid" -o args= 2>/dev/null || true)"
  if [[ "$process_args" != *"port-forward service/${service_name} ${local_port}:80"* ]]; then
    echo "ERROR: el proceso de port-forward de ${service_name} terminó inesperadamente."
    if [[ -f "$log_file" ]]; then
      cat "$log_file"
    fi
    return 1
  fi

  echo "[OK] ${service_name} está listo: ${service_url}"
}

echo "Iniciando Minikube y preparando las APIs..."
minikube start -p "$PROFILE" --driver=docker
kubectl --context="$CONTEXT" wait --for=condition=Ready node --all --timeout=120s
mkdir -p "$PORT_FORWARD_DIR"

deploy_api favoritos microservices/Favoritos.Api/Dockerfile \
  microservices/Favoritos.Api/k8s/favoritos.yaml favoritos-secrets
deploy_api generos microservices/Generos.Api/Dockerfile \
  microservices/Generos.Api/k8s/generos.yaml generos-secrets
deploy_api libros microservices/Libros.Api/Dockerfile \
  microservices/Libros.Api/k8s/libros.yaml libros-secrets
deploy_api publicaciones microservices/Publicaciones.Api/Dockerfile \
  microservices/Publicaciones.Api/k8s/publicaciones.yaml publicaciones-secrets
deploy_api login microservices/Login.Api/Dockerfile \
  microservices/Login.Api/k8s/login.yaml login-secrets
deploy_api usuarios microservices/Usuarios.Api/Dockerfile \
  microservices/Usuarios.Api/k8s/usuarios.yaml usuarios-secrets

ensure_port_forward favoritos 5084
ensure_port_forward generos 5082
ensure_port_forward publicaciones 5085
ensure_port_forward libros 5086
ensure_port_forward login 5087
ensure_port_forward usuarios 5088

echo "Las APIs de Kubernetes están listas."