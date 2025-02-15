#!/usr/bin/env sh


yarn run build
cp 404.html dist
cd dist
git init
git add -A
git commit -m 'deploy'
git push -f  https://github.com/mrtx87/german-election-2025-coalitions.git master:gh-pages
