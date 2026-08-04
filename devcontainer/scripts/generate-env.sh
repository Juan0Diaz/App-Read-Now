#!/usr/bin/env bash
# Genera el .env del frontend automáticamente a partir de los secretos configurados
# en GitHub Codespaces (Settings > Secrets and variables > Codespaces).
#
# Requiere que existan estos secretos:
#   VITE_SUPABASE_URL
#   VITE_SUPABASE_ANON_KEY
#
# Y calcula VITE_API_URL solo, usando variables que Codespaces expone automáticamente
# ($CODESPACE_NAME, $GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN) — así nadie tiene que
# copiar la URL del puerto 5080 a mano.

set -e

ENV_FILE="/workspaces/$(basename "$PWD" 2>/dev/null || echo App-Read-Now)/.env"
# Fallback simple: siempre escribimos en la raíz del workspace actual.
ENV_FILE="$(pwd)/.env"

if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  Faltan los secretos VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY en este Codespace."
  echo "    Ve a GitHub > tu repositorio > Settings > Secrets and variables > Codespaces"
  echo "    y agrégalos. Luego reconstruye el Codespace (o vuelve a abrirlo)."
  exit 0
fi

API_URL="https://${CODESPACE_NAME}-5080.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-app.github.dev}"

cat > "$ENV_FILE" <<EOF
VITE_SUPABASE_URL=${VITE_SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY}
VITE_API_URL=${API_URL}
EOF

echo "✅ .env generado automáticamente en $ENV_FILE"
echo "   VITE_API_URL=${API_URL}"
