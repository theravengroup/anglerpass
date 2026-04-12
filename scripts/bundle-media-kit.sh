#!/usr/bin/env bash
set -euo pipefail

# Navigate to project root (one level up from scripts/)
cd "$(dirname "$0")/.."

TEMP_DIR="anglerpass-media-kit"
ZIP_FILE="public/downloads/anglerpass-media-kit.zip"

# Clean up any previous run
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR/logos" "$TEMP_DIR/screenshots" "$TEMP_DIR/founder"
mkdir -p public/downloads

# ------------------------------------------------------------------
# Check for expected sources and warn if missing
# ------------------------------------------------------------------

PRESS_LOGOS=$(find public/images/press/logos -type f ! -name '.DS_Store' 2>/dev/null)
if [ -z "$PRESS_LOGOS" ]; then
  echo "MISSING: public/images/press/logos/ — add logo files before running"
else
  echo "OK: Found logo files"
fi

if [ ! -d "public/images/press/screenshots" ]; then
  echo "MISSING: public/images/press/screenshots/ — add product screenshots before running"
elif [ -z "$(find public/images/press/screenshots -type f ! -name '.DS_Store' 2>/dev/null)" ]; then
  echo "MISSING: public/images/press/screenshots/ is empty — add product screenshots before running"
else
  echo "OK: Found screenshots"
fi

if [ ! -f "public/images/press/team/dan-jahn-founder-headshot-webres.webp" ]; then
  echo "MISSING: public/images/press/team/dan-jahn-founder-headshot-webres.webp — add founder headshot before running"
else
  echo "OK: Found founder headshot"
fi

echo ""

# ------------------------------------------------------------------
# Copy available assets
# ------------------------------------------------------------------

# Logos (from press/logos directory)
if [ -n "$PRESS_LOGOS" ]; then
  echo "$PRESS_LOGOS" | while read -r f; do
    cp "$f" "$TEMP_DIR/logos/"
  done
  echo "Copied logos: $(ls "$TEMP_DIR/logos/" | wc -l | tr -d ' ') files"
fi

# Screenshots
if [ -d "public/images/press/screenshots" ] && [ -n "$(find public/images/press/screenshots -type f ! -name '.DS_Store' 2>/dev/null)" ]; then
  find public/images/press/screenshots -type f ! -name '.DS_Store' -exec cp {} "$TEMP_DIR/screenshots/" \;
  echo "Copied screenshots: $(ls "$TEMP_DIR/screenshots/" | wc -l | tr -d ' ') files"
fi

# Founder headshot
if [ -f "public/images/press/team/dan-jahn-founder-headshot-webres.webp" ]; then
  cp public/images/press/team/dan-jahn-founder-headshot-webres.webp "$TEMP_DIR/founder/"
  echo "Copied founder headshot"
fi


# ------------------------------------------------------------------
# Create README.txt
# ------------------------------------------------------------------

cat > "$TEMP_DIR/README.txt" << 'READMEEOF'
ANGLERPASS MEDIA KIT
====================

Company: AnglerPass (Angler Pass, LLC)
Website: anglerpass.com
Launch: May 15, 2026
Founder: Dan Jahn
HQ: Denver, Colorado
Press Contact: press@anglerpass.com

CONTENTS:
- /logos — AnglerPass logo in multiple formats
- /screenshots — Product screenshots
- /founder — Founder headshot (Dan Jahn)
USAGE:
All assets may be used for editorial coverage of AnglerPass.
Please credit "AnglerPass" or "anglerpass.com" when using logos or screenshots.
For questions, contact press@anglerpass.com.
READMEEOF

echo "Created README.txt"

# ------------------------------------------------------------------
# Zip and clean up
# ------------------------------------------------------------------

rm -f "$ZIP_FILE"
zip -r "$ZIP_FILE" "$TEMP_DIR" -x '*.DS_Store'
rm -rf "$TEMP_DIR"

echo ""
echo "Done! Media kit: $ZIP_FILE"
ls -lh "$ZIP_FILE" | awk '{print "Size: " $5}'
