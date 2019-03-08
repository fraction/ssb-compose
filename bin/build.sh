#!/usr/bin/env sh

browserify -t sheetify src/client.js | indexhtmlify > build/index.html
