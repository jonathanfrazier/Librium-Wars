#!/bin/sh
# Build the static Librium Saga site for Cloudflare Pages.
# No Node installation, package manager, or external dependencies.
set -eu
rm -rf dist
mkdir -p dist
cp index.html dist/
for folder in assets ages nations religions social-orders characters upload-images; do
  cp -R "$folder" dist/
done
# Keep site text/assets, avoid deploying the obsolete Netlify backend and private docs.
# Cloudflare Pages will serve dist/index.html and all nested page index files.
printf '%s\n' 'Librium Saga static site prepared in dist/'
