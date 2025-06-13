#!/bin/bash

echo "🔍 Redis ve Pub/Sub kritik referansları aranıyor (src klasörlerinde)..."

KEYWORDS=("redis" "pubsub" "broker" "subscribe" "publish")
REGEX=$(IFS="|"; echo "${KEYWORDS[*]}")
OUTPUT_FILE="redis_pubsub_src_refs.txt"
> "$OUTPUT_FILE"

for DIR in ./apps/admin/src ./packages/shared/src; do
  if [ -d "$DIR" ]; then
    grep -rIn --exclude-dir={node_modules,dist,.git,.yarn} -e "$REGEX" "$DIR" >> "$OUTPUT_FILE"
  fi
done

total_files=$(cut -d: -f1 "$OUTPUT_FILE" | sort -u | wc -l)
total_lines=$(wc -l < "$OUTPUT_FILE")

echo -e "\n📄 Bulunan dosya sayısı: $total_files"
echo "📝 Toplam referans satırı sayısı: $total_lines"
echo "🔎 Detaylı referanslar '$OUTPUT_FILE' dosyasına kaydedildi."
echo "✅ İşlem tamamlandı."
