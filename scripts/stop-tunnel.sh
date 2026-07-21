#!/bin/bash
# donjon-dragon — Arrêt du tunnel Cloudflare
# Usage: ./scripts/stop-tunnel.sh

if [ -f /tmp/donjon-tunnel.pid ]; then
  kill "$(cat /tmp/donjon-tunnel.pid)" 2>/dev/null && echo "⛔ Tunnel Cloudflare arrêté"
  rm -f /tmp/donjon-tunnel.pid
fi

rm -f /tmp/donjon-tunnel.log
echo "✅ Tunnel nettoyé"