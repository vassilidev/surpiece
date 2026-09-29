#!/usr/bin/env python3
"""Assemble le site vitrine dans site/dist/ (R19 : fichiers sources, sans framework ni dépendance).

    python3 outils/site.py [--nom "Nom"] [--domaine https://…] [--apercu]      puis servir site/dist/ (python3 -m http.server -d site/dist)

Production (par défaut) : adresses propres, une page par dossier (/neuf/, /ancien/, /conseillers/, /cgu/…), liens et ressources en
chemins absolus, .htaccess pour Apache (OVH mutualisé) ; site/deploiement/nginx.conf pour un serveur nginx.
--apercu : pages à plat (neuf.html…) et liens relatifs, pour un aperçu qui ne sait pas servir de dossier.

- site/pages/*.html : pages, avec des blocs communs {{> nom}} (site/partials/nom.html), {{MARQUE}} (nom du produit, provisoire tant qu'il n'est pas choisi) et {{ILLUSTRATIONS}}
  (site/assets/illustrations.svg.html) ;
- site/assets/ : feuilles de style et scripts, copiés tels quels ;
- site/demo/ : logement de démonstration, produit par outils/site_demo.py (jamais versionné), copié tel quel.
site/dist/ n'est jamais versionné."""
import argparse, datetime, html, json, re, shutil
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / 'site'


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--nom', default='NOM'); ap.add_argument('--domaine', default='https://dejachezmoi.fr')
    ap.add_argument('--apercu', action='store_true'); a = ap.parse_args()
    dist = SITE / 'dist'
    if dist.exists(): shutil.rmtree(dist)
    dist.mkdir()
    if not (SITE / 'demo').exists(): raise SystemExit('site/demo absent : lancer d\'abord python3 outils/site_demo.py')
    ill = (SITE / 'assets' / 'illustrations.svg.html').read_text()
    blocs = {p.stem: p.read_text() for p in (SITE / 'partials').glob('*.html')}
    inclure = lambda t: re.sub(r'\{\{> ([a-z0-9_-]+)\}\}', lambda m: inclure(blocs[m.group(1)]), t)  # blocs communs : {{> nom}}
    indexables = []
    dom = a.domaine.rstrip('/')
    for p in sorted((SITE / 'pages').glob('*.html')):
        t = inclure(p.read_text()).replace('{{ILLUSTRATIONS}}', ill).replace('{{MARQUE}}', a.nom).replace('{{BASE}}', '' if a.apercu else '/')
        t = seo(t, p.name, a.nom, dom)
        if not a.apercu: t = absolus(t)
        cible = dist / (p.name if a.apercu else fichier(p.name)); cible.parent.mkdir(parents=True, exist_ok=True); cible.write_text(t)
        if 'name="robots" content="noindex"' not in t and p.name != '404.html': indexables.append(p.name)
    fichiers_seo(dist, indexables, a.nom, dom)
    if not a.apercu: (dist / '.htaccess').write_text(HTACCESS.format(hote=dom.split('//')[1], pages='|'.join(x.stem for x in (SITE / 'pages').glob('*.html') if x.stem not in ('index', '404'))))
    shutil.copytree(SITE / 'assets', dist / 'assets', ignore=lambda d, f: [x for x in f if x.endswith('.svg.html')])
    shutil.copytree(SITE / 'demo', dist / 'demo')
    pages = sorted(str(p.relative_to(dist)) for p in dist.rglob('*.html') if not str(p.relative_to(dist)).startswith(('demo', 'assets')))
    print(f"site/dist prêt ({a.nom}, {'aperçu' if a.apercu else 'production'}) : " + ', '.join(pages))


ORGA = {'legalName': 'TFA The Forge Agency', 'email': 'contact@dejachezmoi.fr', 'vatID': 'FR02984379503', 'taxID': '984 379 503',
        'address': {'@type': 'PostalAddress', 'streetAddress': '200 rue de la Croix Nivert', 'postalCode': '75015', 'addressLocality': 'Paris', 'addressCountry': 'FR'}}
OFFRES = [('Premier plan', '0'), ('Visite complète', '19'), ('Ultra réaliste', '39')]
PRO = [('Solo', '49'), ('Cabinet', '99'), ('Équipe', '199')]
FIL = {'neuf.html': 'Achat dans le neuf', 'ancien.html': 'Ancien et travaux', 'conseillers.html': 'Conseillers'}


def route(page):
    """Adresse propre d'une page : / pour l'accueil, /neuf/ pour neuf.html."""
    return '/' if page == 'index.html' else '/404.html' if page == '404.html' else f'/{page[:-5]}/'


def fichier(page):
    return 'index.html' if page == 'index.html' else '404.html' if page == '404.html' else f'{page[:-5]}/index.html'


def url(dom, page):
    return dom + route(page)


def absolus(t):
    """Liens et ressources en chemins absolus : neuf.html#prix → /neuf/#prix, assets/… → /assets/…
    (data-pano reste relatif : le script y ajoute la base du site)."""
    t = re.sub(r'href="index\.html(#[^"]*)?"', lambda m: f'href="/{m.group(1) or ""}"', t)
    t = re.sub(r'href="([a-z0-9-]+)\.html(#[^"]*)?"', lambda m: f'href="{route(m.group(1) + ".html")}{m.group(2) or ""}"', t)
    t = re.sub(r'(href|src)="(assets|demo|site\.webmanifest)', r'\1="/\2', t)
    return re.sub(r'url\((demo|assets)/', r'url(/\1/', t)


def texte(h):
    return html.unescape(re.sub(r'<[^>]+>', '', h)).strip()


def seo(t, page, nom, dom):
    """Balises de référencement et de partage, données structurées (JSON-LD) : ajoutées dans le <head> de chaque page."""
    titre = texte(re.search(r'<title>(.*?)</title>', t, re.S).group(1))
    m = re.search(r'<meta name="description" content="([^"]*)"', t); desc = html.unescape(m.group(1)) if m else ''
    u = url(dom, page)
    tete = [f'<link rel="canonical" href="{u}">',
            '<meta name="theme-color" content="#2C49B8">',
            '<link rel="icon" href="assets/img/favicon.svg" type="image/svg+xml">',
            '<link rel="icon" href="assets/img/favicon-32.png" sizes="32x32" type="image/png">',
            '<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">',
            '<link rel="manifest" href="site.webmanifest">',
            '<meta property="og:type" content="website">', '<meta property="og:locale" content="fr_FR">',
            f'<meta property="og:site_name" content="{html.escape(nom)}">', f'<meta property="og:title" content="{html.escape(titre)}">',
            f'<meta property="og:description" content="{html.escape(desc)}">', f'<meta property="og:url" content="{u}">',
            f'<meta property="og:image" content="{dom}/assets/img/og.png">', '<meta property="og:image:width" content="1200">', '<meta property="og:image:height" content="630">',
            '<meta name="twitter:card" content="summary_large_image">', f'<meta name="twitter:title" content="{html.escape(titre)}">',
            f'<meta name="twitter:description" content="{html.escape(desc)}">', f'<meta name="twitter:image" content="{dom}/assets/img/og.png">']
    graphe = [{'@type': 'Organization', '@id': dom + '/#organisation', 'name': nom, 'url': dom + '/', 'logo': dom + '/assets/img/icon-512.png', **ORGA},
              {'@type': 'WebSite', '@id': dom + '/#site', 'name': nom, 'url': dom + '/', 'inLanguage': 'fr-FR', 'publisher': {'@id': dom + '/#organisation'}},
              {'@type': 'WebPage', 'name': titre, 'url': u, 'description': desc, 'inLanguage': 'fr-FR', 'isPartOf': {'@id': dom + '/#site'}}]
    if page in ('index.html', 'neuf.html', 'ancien.html'):
        graphe.append({'@type': 'SoftwareApplication', 'name': nom, 'applicationCategory': 'DesignApplication', 'operatingSystem': 'Web',
                       'description': desc, 'url': dom + '/', 'provider': {'@id': dom + '/#organisation'},
                       'offers': [{'@type': 'Offer', 'name': n, 'price': p, 'priceCurrency': 'EUR', 'url': u + '#prix'} for n, p in OFFRES]})
    if page == 'conseillers.html':
        graphe.append({'@type': 'Service', 'name': f'{nom} Pro', 'serviceType': 'Visites 3D de logements pour conseillers', 'provider': {'@id': dom + '/#organisation'},
                       'areaServed': 'FR', 'offers': [{'@type': 'Offer', 'name': n, 'priceCurrency': 'EUR', 'priceSpecification': {'@type': 'UnitPriceSpecification', 'price': p,
                       'priceCurrency': 'EUR', 'unitCode': 'MON', 'valueAddedTaxIncluded': False}} for n, p in PRO]})
    if page in FIL:
        graphe.append({'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Accueil', 'item': dom + '/'},
                                                                        {'@type': 'ListItem', 'position': 2, 'name': FIL[page], 'item': u}]})
    faq = [(texte(q), texte(r)) for q, r in re.findall(r'<details><summary>(.*?)</summary><p>(.*?)</p></details>', t, re.S)]
    if faq:
        graphe.append({'@type': 'FAQPage', 'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': r}} for q, r in faq]})
    jsonld = json.dumps({'@context': 'https://schema.org', '@graph': graphe}, ensure_ascii=False).replace('</', '<\\/')
    tete.append(f'<script type="application/ld+json">{jsonld}</script>')
    return t.replace('</head>', '\n'.join(tete) + '\n</head>', 1)


def fichiers_seo(dist, pages, nom, dom):
    jour = datetime.date.today().isoformat()
    prio = {'index.html': '1.0', 'neuf.html': '0.9', 'ancien.html': '0.9', 'conseillers.html': '0.8'}
    (dist / 'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
        ''.join(f'  <url><loc>{url(dom, p)}</loc><lastmod>{jour}</lastmod><priority>{prio.get(p, "0.5")}</priority></url>\n' for p in pages) + '</urlset>\n')
    # la démo embarque le moteur et un vrai logement : rien à indexer
    (dist / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nDisallow: /demo/plans/\nDisallow: /demo/moteur/\n\nSitemap: {dom}/sitemap.xml\n')
    (dist / 'site.webmanifest').write_text(json.dumps({'name': nom, 'short_name': nom, 'lang': 'fr', 'start_url': '/', 'display': 'standalone',
        'background_color': '#EDEFEA', 'theme_color': '#2C49B8', 'icons': [{'src': 'assets/img/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
        {'src': '/assets/img/icon-512.png', 'sizes': '512x512', 'type': 'image/png'}]}, ensure_ascii=False, indent=1).replace('"assets/', '"/assets/'))


# Apache (hébergement mutualisé OVH) ; équivalent nginx : site/deploiement/nginx.conf
HTACCESS = r"""# Généré par outils/site.py : ne pas modifier à la main
Options -Indexes -MultiViews
DirectoryIndex index.html
ErrorDocument 404 /404.html
AddDefaultCharset UTF-8
AddType application/manifest+json .webmanifest
AddType font/woff2 .woff2

RewriteEngine On
# HTTPS et domaine sans www
RewriteCond %{{SERVER_PORT}} 80 [OR]
RewriteCond %{{HTTP_HOST}} ^www\. [NC]
RewriteRule ^(.*)$ https://{hote}/$1 [R=301,L]
# anciennes adresses : /index.html → /, /neuf.html → /neuf/
RewriteCond %{{THE_REQUEST}} \s/+(.*/)?index\.html[\s?] [NC]
RewriteRule ^ /%1 [R=301,L]
RewriteRule ^({pages})\.html$ /$1/ [R=301,L]

<IfModule mod_headers.c>
  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; frame-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; object-src 'none'"
  <FilesMatch "\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
  <FilesMatch "\.(css|js|json)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
  <FilesMatch "\.(woff2|png|jpg|jpeg|svg|webp)$">
    Header set Cache-Control "public, max-age=2592000"
  </FilesMatch>
</IfModule>
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css text/javascript application/javascript application/json image/svg+xml text/xml application/xml
</IfModule>
"""


if __name__ == '__main__':
    main()
