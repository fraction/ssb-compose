#!/usr/bin/env sh

set -e

PKGDIR="$(cd "$(dirname "$0")"; pwd -P )/../"
PATH="$(cd "$PKGDIR" && npm bin):$PATH"

cd $PKGDIR
browserify -t sheetify "$PKGDIR/src/client.js" | indexhtmlify > "$PKGDIR/build/index.html"
