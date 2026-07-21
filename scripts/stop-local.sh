#!/bin/bash
# donjon-dragon — Arrêt wifi local
# Usage: ./scripts/stop-local.sh

if [ -f /tmp/donjon-back.pid ]; then
  kill "$(cat /tmp/donjon-back.pid)" 2>/dev/null && echo "⛔ Back arrêté"
  rm -f /tmp/donjon-back.pid
fi

if [ -f /tmp/donjon-front.pid ]; then
  kill "$(cat /tmp/donjon-front.pid)" 2>/dev/null && echo "⛔ Front arrêté"
  rm -f /tmp/donjon-front.pid
fi

echo "✅ Tout arrêté"