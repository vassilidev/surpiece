#!/usr/bin/env python3
"""Polices du site hébergées avec lui (aucun appel à Google Fonts : l'adresse IP des visiteurs ne quitte pas notre serveur).

    python3 outils/site_polices.py

Télécharge Archivo (variable : chasse 62 à 125, graisse 100 à 900) et DM Mono (400, 500), sous-ensembles latin et latin étendu, en
woff2 dans site/assets/fonts/, et écrit site/assets/css/polices.css. Licence SIL Open Font License : hébergement autorisé."""
import re, subprocess
from pathlib import Path

R = Path(__file__).resolve().parent.parent / 'site' / 'assets'
URL = 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&family=DM+Mono:wght@400;500&display=swap'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'


def main():
    # curl plutôt qu'urllib : les certificats du système suffisent, sans installer ceux de Python
    get = lambda u, **k: subprocess.run(['curl', '-fsSL', '-A', UA, u], check=True, capture_output=True).stdout
    css = get(URL).decode()
    (R / 'fonts').mkdir(parents=True, exist_ok=True)
    blocs, garde = re.findall(r'(/\* ([a-z-]+) \*/\s*@font-face \{.*?\})', css, re.S), []
    for bloc, sous in blocs:
        if sous not in ('latin', 'latin-ext'): continue
        fam = re.search(r"font-family: '([^']+)'", bloc).group(1).replace(' ', '')
        poids = re.search(r'font-weight: ([\d ]+);', bloc).group(1).replace(' ', '-')
        src = re.search(r'url\((https://[^)]+\.woff2)\)', bloc).group(1)
        nom = f'{fam}-{poids}-{sous}.woff2'
        (R / 'fonts' / nom).write_bytes(get(src))
        garde.append(bloc.replace(src, f'../fonts/{nom}'))
    (R / 'css' / 'polices.css').write_text('/* Polices hébergées avec le site (outils/site_polices.py), licence SIL OFL */\n' + '\n'.join(garde) + '\n')
    print(f'{len(garde)} polices :', ', '.join(sorted(p.name for p in (R / "fonts").iterdir())))


if __name__ == '__main__':
    main()
