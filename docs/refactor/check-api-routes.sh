#!/usr/bin/env bash
# Prints "VERB /url -> Controller.Action" for every [Http*] attribute under API/Controllers (recursive), sorted.
cd "$(git rev-parse --show-toplevel)/Backend/SportsCenterManagement.API/Controllers"
find . -name '*Controller.cs' | while read -r f; do
  name=$(basename "$f" .cs)
  base=$(grep -m1 -oE '^\s*\[Route\("[^"]*"\)\]' "$f" | sed -E 's/.*"([^"]*)".*/\1/')
  base=${base//\[controller\]/${name%Controller}}
  awk -v base="$base" -v f="$name" '
  /\[Http(Get|Post|Put|Delete|Patch)/ { match($0,/Http(Get|Post|Put|Delete|Patch)/); m=toupper(substr($0,RSTART+4,RLENGTH-4)); r=""; if (match($0,/\("[^"]*"/)) r=substr($0,RSTART+2,RLENGTH-3); pend=1; next }
  pend && /(public|private|protected).*\(/ { if (match($0,/[A-Za-z0-9_]+[ ]*(<[^>]*>)?\(/)) { s=substr($0,RSTART,RLENGTH); sub(/[ ]*(<[^>]*>)?\($/,"",s) } url=(substr(r,1,1)=="~"||substr(r,1,1)=="/") ? r : base (r==""?"":"/" r); sub(/^~/,"",url); printf "%s /%s -> %s.%s\n", m, url, f, s; pend=0 }' "$f"
done | sed 's#//#/#g' | sort
# Usage: bash docs/refactor/check-api-routes.sh | diff <(tr -d "" < docs/refactor/api-routes.baseline.txt | sort) -
