#!/bin/bash
# outils/finalise.sh <id> : réassemble un plan sans nouvel appel IA (reponse-ia.json gardée), visite de contrôle
# avec réparations automatiques (6 tours au plus), puis photos. Le serveur doit tourner (port 8780) pour les outils de capture.
set -u
cd "$(dirname "$0")/.."
id=$1
OPENROUTER_API_KEY= ANTHROPIC_API_KEY= python3 -W ignore -c "
import sys; sys.path.insert(0, 'pipeline'); import lire
P, r = lire.read_plan('plans/$id', '$id'); print('$id assemblé :', len(P['walls']), 'murs, arrêts', [s['id'] for s in P['stops']])
" 2>&1 | tail -1
for i in 1 2 3 4 5 6; do
  out=$(node moteur/controle.mjs plans/$id 2>&1 | tail -1)
  echo "contrôle $i : $out" | cut -c1-300
  echo "$out" | grep -q '"ok":true' && break
  echo "$out" > "/tmp/controle_$id.json"
  python3 -W ignore -c "
import sys, json; sys.path.insert(0, 'pipeline'); import lire
print('réparé :', lire.repare_moteur('plans/$id', json.load(open('/tmp/controle_$id.json'))['problemes']))"
done
rm -rf plans/$id/photos; node moteur/photos.mjs plans/$id 2>&1 | tail -1; ls plans/$id/photos | tr '\n' ' '; echo
