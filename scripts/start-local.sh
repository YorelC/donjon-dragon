#!/bin/bash
# donjon-dragon — Démarrage wifi local
# Usage: ./scripts/start-local.sh

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP=$(ipconfig.exe | grep -i "IPv4" | head -1 | awk '{print $NF}' 2>/dev/null || echo "192.168.x.x")

echo "🏗️  Building back..."
cd "$ROOT/back" && npx nest build 2>&1 || { echo "❌ Build back échoué"; exit 1; }

echo "🚀 Starting back (port 3000)..."
cd "$ROOT/back" && node dist/back/src/main.js &
echo $! > /tmp/donjon-back.pid

echo "🚀 Starting front (port 5173)..."
cd "$ROOT/front" && npx vite --host 0.0.0.0 &
echo $! > /tmp/donjon-front.pid

echo ""
echo "✅ Tout est lancé !"
echo "Front : http://$IP:5173"
echo "Back  : http://$IP:3000"
echo ""
echo "Pour arrêter : ./scripts/stop-local.sh"