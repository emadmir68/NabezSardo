#!/usr/bin/env bash
# سه کارت خبری جدید برای خبرهای بدون کارت (شهید دادگستر، آکادمی دوومیدانی، آبیاری قطرهای)
set -u
cd /home/z/my-project/public/images

gen() {
  local name="$1"; local prompt="$2"; local tries=0
  while [ $tries -lt 4 ]; do
    echo ">>> $name (try $((tries+1)))"
    if z-ai image -p "$prompt" -o "$name" -s 1152x864 2>&1 | tail -2 | grep -q "completed"; then
      echo "OK: $name"
      return 0
    fi
    tries=$((tries+1))
    sleep 20
  done
  echo "FAILED: $name"
  return 1
}

gen "news-martyr.png" "Photorealistic photo of an Iranian martyr commemoration memorial, fresh red tulip flowers laid at the base of a stone martyr monument with an Iranian flag gracefully draped, soft respectful evening light, shallow depth of field, dignified solemn mood, editorial news photography, warm color grade, high quality, no people faces"
sleep 15
gen "news-athletics.png" "Photorealistic photo of a track and field stadium with red running lanes and white lane markings, starting blocks and hurdles on the track, young athletes sprinting during training at golden hour, dynamic low angle, empty stadium seats in background, editorial sports photography, warm color grade, high quality"
sleep 15
gen "news-irrigation.png" "Photorealistic photo of a modern drip irrigation system with black drip lines watering rows of young green trees along a city boulevard in a dry southern Iranian town, water droplets glistening in morning light, arid mountains in the background, editorial news photography, high quality"

echo "===== DONE ====="
ls -la news-martyr.png news-athletics.png news-irrigation.png
