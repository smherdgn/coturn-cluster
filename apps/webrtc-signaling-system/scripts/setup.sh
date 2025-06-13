#!/bin/bash

set -e

SOURCE_DIR="./src_files"  # Tüm *.ts dosyalarının bulunduğu klasör
PROJECT_ROOT="./your-project"  # Kodların yazılacağı proje kök klasörü (değiştir)

mkdir -p "$PROJECT_ROOT"

for FILE in "$SOURCE_DIR"/*.ts; do
  echo "📄 İşleniyor: $FILE"
  CURRENT_LINES=()
  TARGET_PATH=""

  while IFS= read -r LINE || [ -n "$LINE" ]; do
    if [[ $LINE =~ ^//\ src/.*\.ts ]]; then
      # Hedef dosya yolu satırı geldi: önce varsa biriktirilenleri yaz
      if [[ ${#CURRENT_LINES[@]} -gt 0 && -n "$TARGET_PATH" ]]; then
        OUT_PATH="$PROJECT_ROOT/$TARGET_PATH"
        mkdir -p "$(dirname "$OUT_PATH")"
        printf "%s\n" "${CURRENT_LINES[@]}" > "$OUT_PATH"
        echo "✅ Yazıldı: $OUT_PATH"
        CURRENT_LINES=()
      fi
      # Yeni hedef dosya yolunu al
      TARGET_PATH=$(echo "$LINE" | sed -E 's|^// src/||')
    else
      CURRENT_LINES+=("$LINE")
    fi
  done < "$FILE"

  # Dosya sonu: son blok varsa onu da yaz
  if [[ ${#CURRENT_LINES[@]} -gt 0 && -n "$TARGET_PATH" ]]; then
    OUT_PATH="$PROJECT_ROOT/$TARGET_PATH"
    mkdir -p "$(dirname "$OUT_PATH")"
    printf "%s\n" "${CURRENT_LINES[@]}" > "$OUT_PATH"
    echo "✅ Yazıldı: $OUT_PATH"
  fi
done

echo "🎉 Tüm dosyalar işlendi."