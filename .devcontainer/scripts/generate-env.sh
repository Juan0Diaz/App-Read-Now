#!/usr/bin/env bash
# Genera el .env del frontend a partir de los secretos configurados
# en GitHub Codespaces (Settings > Secrets and variables > Codespaces).
#
# Requiere:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY

set -e

ENV_FILE="$(pwd)/.env"
PORT_FORWARDING_DOMAIN="${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"

if [ -z "${VITE_SUPABASE_URL:-}" ] || [ -z "${VITE_SUPABASE_ANON_KEY:-}" ]; then
  echo "Faltan los secretos VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY."
  echo "Configúralos en GitHub > Settings > Secrets and variables > Codespaces."
  echo "Luego reconstruye el Codespace o vuelve a abrirlo."
  exit 0
fi

if [ -n "${CODESPACE_NAME:-}" ]; then
  API_URL="https://${CODESPACE_NAME}-5080.${PORT_FORWARDING_DOMAIN}"
  LIBROS_API_URL="${API_URL}/gateway"
  FAVORITOS_API_URL="${API_URL}/gateway"
  GENEROS_API_URL="https://${CODESPACE_NAME}-5082.${PORT_FORWARDING_DOMAIN}"
  PUBLICACIONES_API_URL="https://${CODESPACE_NAME}-5085.${PORT_FORWARDING_DOMAIN}"
  LOGIN_API_URL="https://${CODESPACE_NAME}-5087.${PORT_FORWARDING_DOMAIN}"
else
  API_URL="http://localhost:5080"
  LIBROS_API_URL="${API_URL}/gateway"
  FAVORITOS_API_URL="${API_URL}/gateway"
  GENEROS_API_URL="http://localhost:5082"
  PUBLICACIONES_API_URL="http://localhost:5085"
  LOGIN_API_URL="http://localhost:5083"
fi

cat > "$ENV_FILE" <<EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_API_URL=${API_URL}
VITE_LIBROS_API_URL=${LIBROS_API_URL}
VITE_FAVORITOS_API_URL=${FAVORITOS_API_URL}
VITE_GENEROS_API_URL=${GENEROS_API_URL}
VITE_PUBLICACIONES_API_URL=${PUBLICACIONES_API_URL}
VITE_LOGIN_API_URL=${LOGIN_API_URL}
EOF

echo "Archivo .env generado en $ENV_FILE"
echo "VITE_API_URL=${API_URL}"
echo "VITE_LIBROS_API_URL=${LIBROS_API_URL}"
echo "VITE_FAVORITOS_API_URL=${FAVORITOS_API_URL}"
echo "VITE_GENEROS_API_URL=${GENEROS_API_URL}"
echo "VITE_PUBLICACIONES_API_URL=${PUBLICACIONES_API_URL}"
echo "VITE_LOGIN_API_URL=${LOGIN_API_URL}"