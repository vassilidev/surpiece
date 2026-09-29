#!/bin/bash
# outils/finalise.sh <id> : réassemble un plan sans nouvel appel IA (reponse-ia.json gardée), visite de contrôle
# avec réparations automatiques (6 tours au plus), puis photos et visite à 360°. Le serveur doit tourner (port 8780) pour les outils de capture.
set -u
cd "$(dirname "$0")/.."
id=$1
# page de visite toujours reprise du modèle (moteur three.js servi avec la visite, moteur/vendor : plus de dépendance au réseau, fiche C9)
cp moteur/modele.html plans/$id/index.html
OPENROUTER_API_KEY= ANTHROPIC_API_KEY= PLAN_PROVIDER= python3 -W ignore -c "
import sys; sys.path.insert(0, 'pipeline'); import lire
P, r = lire.read_plan('plans/$id', '$id'); print('$id assemblé :', len(P['walls']), 'murs, arrêts', [s['id'] for s in P['stops']])
" 2>&1 | tail -1
for i in 1 2 3 4 5 6; do
  out=$(node moteur/controle.mjs plans/$id 2>&1 | tail -1)
  echo "contrôle $i : $out" | cut -c1-300
  echo "$out" | grep -q '"ok":true' && break
  echo "$out" > "/tmp/controle_$id.json"
  OPENROUTER_API_KEY= ANTHROPIC_API_KEY= PLAN_PROVIDER= python3 -W ignore -c "
import sys, json; sys.path.insert(0, 'pipeline'); import lire
print('réparé :', lire.repare_moteur('plans/$id', json.load(open('/tmp/controle_$id.json'))['problemes']))"
done
rm -rf plans/$id/photos; node moteur/photos.mjs plans/$id 2>&1 | grep -E '\[erreur|reprise' ; ls plans/$id/photos | tr '\n' ' '; echo
rm -rf plans/$id/pano; node moteur/pano.mjs plans/$id 2>&1 | tail -1
