#!/bin/bash

set -euo pipefail

echo "🧹 Eski servisler durduruluyor ve temizleniyor..."
docker compose down --remove-orphans || true

echo "🔧 Ortam kontrolü..."
[ ! -f ".env" ] && echo "❌ .env dosyası eksik!" && exit 1

echo "🐳 Docker imajları build ediliyor..."
docker compose build

echo "🚀 Servisler başlatılıyor..."
docker compose up -d

echo ""
echo "⏳ Health check bekleniyor..."

MAX_RETRIES=20
SLEEP_INTERVAL=3
SERVICES=$(docker compose config --services)

all_healthy=false
for ((i=1; i<=MAX_RETRIES; i++)); do
  all_healthy=true
  for svc in $SERVICES; do
    container=$(docker compose ps -q "$svc")
    status=$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "none")

    if [[ "$status" != "healthy" && "$status" != "none" ]]; then
      all_healthy=false
      echo "❌ $svc durumu: $status"
    else
      echo "✅ $svc sağlıklı ($status)"
    fi
  done

  if $all_healthy; then
    echo "🎉 Tüm servisler sağlıklı!"
    break
  fi

  if [[ $i == $MAX_RETRIES ]]; then
    echo "⛔ Health check zaman aşımına uğradı!"
    exit 1
  fi

  sleep $SLEEP_INTERVAL
  echo "🔁 Kontrol tekrarlanıyor ($i/$MAX_RETRIES)..."
done

echo ""
echo "📦 Çalışan konteynerler:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "📜 Canlı loglar başlatılıyor. Çıkmak için Ctrl+C"
echo ""
docker compose logs -f --tail=30
