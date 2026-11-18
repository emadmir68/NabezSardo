#!/usr/bin/env bash
# Nabz Sardo v2 image set — AI-generated, face-free, ink+gold editorial style
set -u
cd /home/z/my-project/public/images

gen() {
  local name="$1"; local prompt="$2"; local size="$3"; local tries=0
  while [ $tries -lt 4 ]; do
    echo ">>> $name (try $((tries+1)), $size) $(date +%H:%M:%S)"
    if z-ai image -p "$prompt" -o "$name" -s "$size" 2>&1 | tail -2 | grep -q "completed"; then
      echo "OK: $name"
      return 0
    fi
    tries=$((tries+1))
    sleep 18
  done
  echo "FAILED: $name"
  return 1
}

gen "news-storm.png" "Dramatic cinematic photograph of a thunderstorm approaching an arid mountain valley in southern Iran, dark towering storm clouds with a distant lightning strike, dusty golden sunset light breaking under the clouds, palm trees swaying in strong wind, empty desert road, moody indigo and amber color grade, professional weather news photography, no text, no watermark" "1344x768"
sleep 12
gen "news-valley.png" "Cinematic panoramic photograph of a small Iranian mountain town at dusk nestled in a rugged high valley of the Hazar mountains in Kerman province, terraced rocky slopes with scattered walnut and pine trees, warm golden window lights in low-rise houses, a slender mosque minaret silhouette, deep indigo twilight sky with early stars and thin clouds, atmospheric haze, professional editorial photography, rich gold and dark navy color grade, no text, no watermark" "1344x768"
sleep 12
gen "news-mosque.png" "Serene photograph of a traditional southern Iranian mosque at dusk with a turquoise-tiled dome and elegant minaret, warm lantern glow on intricate brick and tile work, empty stone courtyard with a small reflecting pool, deep blue evening sky, cypress trees, peaceful atmosphere, professional architectural photography, no people, no text, no watermark" "1152x864"
sleep 12
gen "news-poet.png" "Warm still life photograph of an open book of Persian poetry with elegant handwritten calligraphy pages on an aged wooden desk, vintage brass inkwell and reed pen, dried damask roses and a small brass teapot, soft candlelight, shallow depth of field, cultural editorial photography, rich amber and dark tones, no readable text, no watermark" "1152x864"
sleep 12
gen "news-dates.png" "Close-up photograph of premium Iranian Mazafati dates overflowing from a traditional woven basket, golden hour light, blurred date palm grove background in southern Iran, rich amber and chocolate tones, appetizing editorial food photography, no text, no watermark" "1152x864"
sleep 12
gen "news-flag.png" "Photograph of the Iranian flag waving on a tall flagpole at dusk in front of a stately government building with arched facade in a southern Iranian city, warm golden floodlights on the facade, deep indigo evening sky, cinematic editorial photography, no people, no text, no watermark" "1152x864"
sleep 12
gen "news-radar.png" "Cinematic night photograph of a military early warning radar station on a rocky desert hilltop, large radar array silhouette against a dark indigo sky, subtle amber glow of instrument panels and a faint red aviation warning light, stars, professional defense news photography, no text, no watermark" "1152x864"
sleep 12
gen "news-police.png" "Cinematic night photograph of a police checkpoint on a desert highway in southern Iran, blue and red lights flashing on a police SUV, light fog and dust, rocky mountains in the background under moonlight, no visible people, professional news photography, deep blue and warm amber tones, no text, no watermark" "1152x864"
sleep 12
gen "news-students.png" "Warm photograph seen from behind of happy Iranian school students in uniform holding certificates and a robotics competition trophy in a decorated school hall, golden confetti in the air, warm stage lighting, celebratory mood, faces not visible, professional editorial photography, no text, no watermark" "1152x864"
sleep 12
gen "news-mourning.png" "Atmospheric photograph of black mourning banners with green and red trim hanging across a narrow old Iranian bazaar alley with brick arches, soft overcast light, Tasua Ashura mood, empty alley, deep black and dark green tones with warm light accents, professional editorial photography, no people, no readable text, no watermark" "1152x864"
sleep 12
gen "news-bus.png" "Photograph of an intercity bus stopped at a roadside inspection checkpoint in southern Iran at golden hour, open luggage compartments with gas cylinders visible, desert mountains in the background, traffic police vehicle with flashing lights behind, seen from the side, no visible faces, professional news photography, no text, no watermark" "1152x864"
sleep 12
gen "news-university.png" "Photograph of a modern Iranian university campus building with Islamic arched windows and autumn trees at golden hour, students walking in the far distance, warm sandstone facade, clear sky, professional editorial photography, no readable text, no watermark" "1152x864"
sleep 12
gen "news-bear.png" "Wildlife photograph of a Syrian brown bear standing on a rocky slope in the Zagros mountains of Iran at dawn, mist between ridges, alert posture, dramatic soft morning light, professional wildlife photography, no text, no watermark" "1152x864"
sleep 12
gen "news-flood.png" "Dramatic photograph of a concrete flood channel and small dam spillway in an arid Iranian town after heavy rain, muddy turbulent water, wet stones, heavy grey clouds with golden light breaking through, desert mountains, professional news photography, no people, no text, no watermark" "1152x864"
sleep 12
gen "news-economy.png" "Photograph of an empty modern conference room with a long polished table, nameplates and microphones, two Iranian flags on stands beside large windows overlooking a city at dusk, warm interior lighting, professional editorial photography, no people, no readable text, no watermark" "1152x864"
sleep 12
gen "news-election.png" "Photograph of a transparent ballot box on a table draped with an Iranian flag in a school classroom used as a polling station, voting booth with blue curtain in background, warm morning light, professional news photography, no people, no text, no watermark" "1152x864"
sleep 12
gen "news-justice.png" "Photograph of an official wooden desk with stacked legal documents, a classic brass scales of justice statue, a fountain pen and an Iranian flag softly blurred in the background, warm desk lamp light, dark wood tones, professional editorial photography, no readable text, no watermark" "1152x864"
sleep 12
gen "news-school.png" "Photograph of an Iranian school courtyard at morning with tall sycamore trees, a large round clock on a brick wall, students shadows on the ground, warm autumn morning light, empty benches, professional editorial photography, no visible faces, no readable text, no watermark" "1152x864"
sleep 12
gen "news-health.png" "Photograph of a bright occupational health clinic in Iran, a nurse in hijab preparing a blood pressure monitor at a clean examination station seen from behind, soft daylight, modern medical equipment, professional healthcare news photography, no visible faces, no readable text, no watermark" "1152x864"

echo "===== FINAL ====="
ls -la /home/z/my-project/public/images/
echo "===== DONE $(date +%H:%M:%S) ====="
