#!/usr/bin/env bash
# Package the "41 Blythe" app and install it on the Samsung over Developer Mode.
#   TV_HOST=<tv ip> ./install-app.sh [certificate profile name, default: blythe]
# Needs: Developer Mode on with this computer's IP as Host PC IP, Tizen Studio CLI in ~/tizen-studio,
# and a Samsung certificate profile made in Certificate Manager (README.md, section 3).
set -euo pipefail
: "${TV_HOST:?set TV_HOST to the TV IP address}"
PROFILE="${1:-blythe}"
TIZEN_HOME="${TIZEN_HOME:-$HOME/tizen-studio}"
TIZEN="$TIZEN_HOME/tools/ide/bin/tizen"
SDB="$TIZEN_HOME/tools/sdb"
HERE="$(cd "$(dirname "$0")" && pwd)"
TARGET="$TV_HOST:26101"

[ -x "$TIZEN" ] || { echo "Tizen Studio CLI not found at $TIZEN (set TIZEN_HOME if it is elsewhere)" >&2; exit 1; }
[ -f "$HERE/app/config.js" ] || { echo "Missing app/config.js: cp app/config.example.js app/config.js and fill it in (or set demo: true)" >&2; exit 1; }

echo "== Connecting to the TV ($TARGET)"
"$SDB" connect "$TARGET"
"$SDB" devices | grep -q "$TV_HOST" || { echo "The TV did not connect. Check Developer Mode is on, Host PC IP is this computer, and the TV was restarted." >&2; exit 1; }

# Package from a clean copy: only the app's own files, and a .wgt name without spaces
# (Samsung's installer fails silently on a name with spaces).
BUILD="$(mktemp -d)"
trap 'rm -rf "$BUILD"' EXIT
cp "$HERE"/app/{config.xml,index.html,app.js,style.css,icon.png,config.js} "$BUILD/"

echo "== Packaging with certificate profile '$PROFILE'"
"$TIZEN" package -t wgt -s "$PROFILE" -- "$BUILD"
WGT="$(ls "$BUILD"/*.wgt | head -1)"
[ -f "$WGT" ] || { echo "Packaging made no .wgt (is the certificate profile '$PROFILE' there? Certificate Manager)" >&2; exit 1; }
mv "$WGT" "$BUILD/BlytheHome.wgt"

echo "== Installing"
"$TIZEN" install -n BlytheHome.wgt -s "$TARGET" -- "$BUILD"

echo "== Opening it"
"$TIZEN" run -p BlytheHom0.BlytheHome -s "$TARGET" || true
echo "Done. It's under Apps on the TV as \"41 Blythe\"; select it and choose Add to Home to keep it on the Home bar."
