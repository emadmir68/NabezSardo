#!/usr/bin/env bash
# Fix the 3 owner-flagged images — strong Iranian context
set -u
cd /home/z/my-project/public/images

gen() {
  local name="$1"; local prompt="$2"; local tries=0
  while [ $tries -lt 4 ]; do
    echo ">>> $name (try $((tries+1))) $(date +%H:%M:%S)"
    if z-ai image -p "$prompt" -o "$name" -s "1152x864" 2>&1 | tail -2 | grep -q "completed"; then
      echo "OK: $name"
      return 0
    fi
    tries=$((tries+1))
    sleep 18
  done
  echo "FAILED: $name"
  return 1
}

gen "news-flag.png" "Authentic Iranian news agency photograph: an elderly Iranian Shia cleric wearing a black turban and dark clerical robe giving a Friday prayer sermon from a wooden minbar pulpit inside a grand mosque in Kerman, seen from a side-rear angle so his face is not clearly visible, behind him a very large Iranian national flag hanging on the wall with correct horizontal green, white and red stripes and the red emblem in the center of the white stripe, soft warm mosque lighting, rows of pale green prayer rugs in foreground, dignified official atmosphere of the Islamic Republic of Iran, photojournalism style, no text, no watermark"
sleep 15
gen "news-economy.png" "Authentic Iranian news photograph of a formal economic development meeting in Iran: several Iranian officials and business owners in dark suits seated around a long wooden conference table with documents, microphones and glasses of tea, a large Iranian national flag with green white and red stripes standing on a polished pole beside a wooden podium, formal Iranian government meeting room with Persian carpet and warm chandelier lighting, a small bowl of Rafsanjan pistachios on the table, photographed from the back of the room so faces are not clearly visible, photojournalism style, no readable text, no watermark"
sleep 15
gen "news-mourning.png" "Somber photograph of an official public mourning day in Iran: the Iranian national flag flying at half-mast on a tall flagpole in front of a stone government building, long black mourning banners draped across the building facade, black flags hanging from lampposts along a quiet empty street, overcast grey sky, dignified respectful atmosphere, photojournalism style, no people, no readable text, no watermark"

echo "===== DONE $(date +%H:%M:%S) ====="
ls -la news-flag.png news-economy.png news-mourning.png
