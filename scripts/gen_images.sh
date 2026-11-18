#!/usr/bin/env bash
# Sequential image generation with rate-limit-friendly delays
set -u
cd /home/z/my-project/public/images

gen() {
  local name="$1"; local prompt="$2"; local size="$3"; local tries=0
  while [ $tries -lt 4 ]; do
    echo ">>> $name (try $((tries+1)), $size)"
    if z-ai image -p "$prompt" -o "$name" -s "$size" 2>&1 | tail -2 | grep -q "completed"; then
      echo "OK: $name"
      return 0
    fi
    tries=$((tries+1))
    sleep 20
  done
  echo "FAILED: $name"
  return 1
}

gen "hero-mosque.png" "Cinematic photograph of a beautiful small-town Iranian mosque with a tall minaret at dusk, warm golden window lights glowing against deep indigo night sky, silhouettes of date palm trees, moody atmospheric haze, professional editorial photography for news website hero, rich warm gold and dark teal color grade, high quality, detailed" "1920x1088"
sleep 15
gen "news-agriculture.png" "Photorealistic photo of farmer hands holding fresh golden dates during date palm harvest in southern Iran, warm sunset light, shallow depth of field, editorial news photography, warm gold color grade, high quality" "1152x864"
sleep 15
gen "news-sports.png" "Photorealistic photo of Iranian youth playing football on a dusty local village football field at golden hour, dust glowing in backlit sun, dramatic warm editorial photography, high quality" "1152x864"
sleep 15
gen "news-culture.png" "Photorealistic photo of nighttime Persian cultural festival in small village square, warm lanterns and string lights, people gathered around traditional ceremony, deep blue night sky with warm golden light, editorial photography, high quality" "1152x864"

echo "===== FINAL ====="
ls -la /home/z/my-project/public/images/
