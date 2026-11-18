#!/usr/bin/env bash
# Install official Anthropic web-design skills directly from GitHub
set -e
cd /tmp
rm -rf anthropic-skills anthropics-skills-main.tar.gz
echo "Downloading anthropics/skills repo..."
curl -sL --max-time 120 -o anthropics-skills-main.tar.gz https://github.com/anthropics/skills/archive/refs/heads/main.tar.gz
tar xzf anthropics-skills-main.tar.gz
mv skills-main anthropics-skills-main
ls -d anthropics-skills-main/skills/*/ | head -30

SKILLS_DIR=/home/z/my-project/skills
mkdir -p "$SKILLS_DIR/anthropics"

# Web-design relevant skills to install
WANTED="frontend-design web-artifacts-builder webapp-testing theme-factory canvas-design brand-guidelines"

for s in $WANTED; do
  if [ -d "anthropics-skills-main/skills/$s" ]; then
    rm -rf "$SKILLS_DIR/anthropics/$s"
    cp -r "anthropics-skills-main/skills/$s" "$SKILLS_DIR/anthropics/$s"
    echo "INSTALLED: anthropics/$s"
  else
    echo "MISSING: $s"
  fi
done

echo "===== FILES ====="
find "$SKILLS_DIR/anthropics" -name "SKILL.md" | while read f; do echo "$f"; done
