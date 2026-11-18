#!/usr/bin/env bash
# Install shadcn/improve, HeroUI and Clerk skills from GitHub
set -e
SKILLS_DIR=/home/z/my-project/skills
mkdir -p "$SKILLS_DIR/shadcn" "$SKILLS_DIR/heroui" "$SKILLS_DIR/clerk"

# --- shadcn/improve ---
if [ -d /tmp/shadcn-improve/skills/improve ]; then
  rm -rf "$SKILLS_DIR/shadcn/improve"
  cp -r /tmp/shadcn-improve/skills/improve "$SKILLS_DIR/shadcn/improve"
  echo "INSTALLED: shadcn/improve"
else
  echo "MISSING: shadcn improve dir"
fi

# --- HeroUI (heroui-inc/heroui repo) ---
cd /tmp
rm -rf heroui-skills heroui-main.tar.gz
curl -sL --max-time 90 -o heroui-main.tar.gz https://github.com/heroui-inc/heroui/archive/refs/heads/main.tar.gz || echo "heroui download failed"
if [ -f heroui-main.tar.gz ]; then
  tar tzf heroui-main.tar.gz >/dev/null 2>&1 && tar xzf heroui-main.tar.gz || true
  FOUND=$(ls -d heroui-main*/ 2>/dev/null | head -1 || true)
  echo "heroui extracted dir: ${FOUND:-none}"
  if [ -n "$FOUND" ]; then
    find "heroui-v3-main" "$FOUND" -type d -name "*skill*" 2>/dev/null | head -10 || true
    SKILL_DIR=$(find "$FOUND" -type d -path "*skills*heroui-react*" 2>/dev/null | head -1)
    [ -z "$SKILL_DIR" ] && SKILL_DIR=$(find "$FOUND" -type f -name "SKILL.md" 2>/dev/null | head -1 | xargs dirname 2>/dev/null)
    if [ -n "$SKILL_DIR" ]; then
      rm -rf "$SKILLS_DIR/heroui/heroui-react"
      cp -r "$SKILL_DIR" "$SKILLS_DIR/heroui/heroui-react"
      echo "INSTALLED: heroui/heroui-react from $SKILL_DIR"
    else
      echo "MISSING: heroui skill dir not found"
    fi
  fi
fi

# --- Clerk (clerk/skills repo) ---
rm -rf clerk-skills clerk-main.tar.gz
curl -sL --max-time 90 -o clerk-main.tar.gz https://github.com/clerk/skills/archive/refs/heads/main.tar.gz || echo "clerk download failed"
if [ -f clerk-main.tar.gz ]; then
  tar tzf clerk-main.tar.gz >/dev/null 2>&1 && tar xzf clerk-main.tar.gz || true
  if [ -d clerk-main ]; then
    mv clerk-main clerk-skills 2>/dev/null || true
    ls clerk-skills/ 2>/dev/null || true
    for s in clerk clerk-react-patterns; do
      SRC=$(find clerk-skills -type d -name "$s" 2>/dev/null | head -1)
      if [ -n "$SRC" ]; then
        rm -rf "$SKILLS_DIR/clerk/$s"
        cp -r "$SRC" "$SKILLS_DIR/clerk/$s"
        echo "INSTALLED: clerk/$s"
      else
        echo "MISSING: clerk/$s"
      fi
    done
  fi
fi

echo "===== FINAL LIST ====="
find "$SKILLS_DIR" -name "SKILL.md" | sort
