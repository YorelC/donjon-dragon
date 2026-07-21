#!/bin/bash
# donjon-dragon — Tunnel Cloudflare (accès depuis l'extérieur)
# Usage: ./scripts/start-tunnel.sh
# Prérequis : les serveurs tournent déjà (start-local.sh ou pnpm dev)
# Effet : expose le front (port 5173) sur une URL publique trycloudflare.com

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Vérifier que le front tourne
if ! curl -s -o /dev/null http://localhost:5173/ 2>/dev/null; then
  echo "❌ Le front ne répond pas sur http://localhost:5173"
  echo "   Lance d'abord : ./scripts/start-local.sh"
  exit 1
fi

# Vérifier que cloudflared est installé
if ! command -v cloudflared &>/dev/null; then
  echo "📦 Installation de cloudflared..."
  npm install -g cloudflared 2>&1 | tail -1
fi

echo "🌐 Démarrage du tunnel Cloudflare..."
echo "   (un lien public va s'afficher d'ici quelques secondes)"
echo ""

# Capturer l'URL générée par cloudflared
cloudflared tunnel --url http://localhost:5173 2>&1 | tee /tmp/donjon-tunnel.log &
CLOUDFLARED_PID=$!
echo $CLOUDFLARED_PID > /tmp/donjon-tunnel.pid

# Attendre que l'URL soit disponible
for i in $(seq 1 20); do
  URL=$(grep -oP 'https://[a-z-]+\.trycloudflare\.com' /tmp/donjon-tunnel.log 2>/dev/null | head -1)
  if [ -n "$URL" ]; then
    echo ""
    echo "✅ Tunnel actif !"
    echo "   📱 Ouvre dans ton navigateur :"
    echo "      $URL"
    echo ""
    echo "⏹️  Pour arrêter : ./scripts/stop-tunnel.sh"
    break
  fi
  sleep 2
done

if [ -z "$URL" ]; then
  echo "⚠️  Le tunnel n'a pas encore d'URL, consulte /tmp/donjon-tunnel.log"
fi