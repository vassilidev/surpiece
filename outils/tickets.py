# python3 outils/tickets.py : régénère tickets/README.md à partir de l'en-tête de chaque ticket.
# python3 outils/tickets.py --verifier : contrôle seulement (en-têtes, dépendances existantes, sans boucle,
# jamais vers un lot plus tardif) ; code de sortie 1 au moindre problème, pour la CI.
import re, sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
T = RACINE / 'tickets'
JOURS = {'S': 1, 'M': 2, 'L': 4}          # charge comptée par taille, pour une personne
COLS = ['Lot', 'Priorité', 'Taille', 'Dépend de', 'Touche', 'Statut']
ID = re.compile(r'L(\d+)-(\d+)')


def lire(f):
    """en-tête d'un ticket : « # ID · Titre » puis le tableau à 6 colonnes"""
    lignes = f.read_text().splitlines()
    m = re.match(r'#\s+(L\d+-\d+)\s+·\s+(.+)', lignes[0] if lignes else '')
    if not m:
        return None, f'{f.relative_to(RACINE)} : première ligne attendue « # L<n>-<nn> · Titre »'
    for i, l in enumerate(lignes):
        if [c.strip() for c in l.strip().strip('|').split('|')] == COLS and i + 2 < len(lignes):
            v = [c.strip() for c in lignes[i + 2].strip().strip('|').split('|')]
            if len(v) != 6:
                return None, f'{m[1]} : ligne d\'en-tête à {len(v)} colonnes au lieu de 6'
            t = dict(zip(COLS, v), id=m[1], titre=m[2].strip(), fichier=f.relative_to(T).as_posix())
            t['deps'] = [f'L{a}-{b}' for a, b in ID.findall(t['Dépend de'])]
            t['taille'] = (t['Taille'][:1] or '?')
            return t, None
    return None, f'{m[1]} : tableau d\'en-tête introuvable (colonnes {" | ".join(COLS)})'


def cle(i):
    a, b = ID.fullmatch(i).groups()
    return int(a), int(b)


def charger():
    tickets, erreurs = {}, []
    for f in sorted(T.glob('*/L*.md')):
        t, e = lire(f)
        if e:
            erreurs.append(e); continue
        if t['id'] in tickets:
            erreurs.append(f"{t['id']} : identifiant en double ({tickets[t['id']]['fichier']}, {t['fichier']})"); continue
        if not f.name.startswith(t['id'] + '-'):
            erreurs.append(f"{t['id']} : le nom du fichier {f.name} ne commence pas par l'identifiant")
        tickets[t['id']] = t
    for t in tickets.values():
        for d in t['deps']:
            if d not in tickets:
                erreurs.append(f"{t['id']} dépend de {d}, introuvable")
            elif cle(d)[0] > cle(t['id'])[0]:
                erreurs.append(f"{t['id']} dépend de {d}, d'un lot plus tardif")
        if t['taille'] not in JOURS:
            erreurs.append(f"{t['id']} : taille « {t['Taille']} » inconnue (S, M ou L)")
    etat = {}
    def visite(i, pile):                     # boucles de dépendances
        if etat.get(i) == 2:
            return
        if etat.get(i) == 1:
            erreurs.append('boucle : ' + ' → '.join(pile[pile.index(i):] + [i])); return
        etat[i] = 1
        for d in tickets[i]['deps']:
            if d in tickets:
                visite(d, pile + [i])
        etat[i] = 2
    for i in tickets:
        visite(i, [])
    return tickets, erreurs


def index(tickets):
    lots = {}
    for t in sorted(tickets.values(), key=lambda t: cle(t['id'])):
        lots.setdefault(cle(t['id'])[0], []).append(t)
    fait = lambda t: t['Statut'].lower().startswith('fait')
    out = ['# Tickets', '',
           'Index généré par `python3 outils/tickets.py` à partir de l\'en-tête de chaque ticket : ne pas l\'éditer à la main. '
           'Le plan d\'ensemble, les décisions et l\'ordre de reprise sont dans [`produit/PLAN.md`](../produit/PLAN.md).', '',
           '**Mode d\'emploi.** Un ticket = une branche courte. On passe son statut à « En cours » puis « Fait » dans son en-tête, '
           'et on régénère cet index. Un ticket qui touche `pipeline/` [P] ou `moteur/` [M] ne se fusionne qu\'avec le critère '
           'de `produit/ARCHITECTURE.md` § 8.1 (rejeu sans IA identique, visite de contrôle, contrôle des textes). '
           'Tout défaut trouvé devient un contrôle automatique. `python3 outils/tickets.py --verifier` contrôle les en-têtes et les dépendances.', '',
           f'Priorités : P0 indispensable au jalon du lot, P1 important, P2 plus tard. Tailles : S jusqu\'à 1 j, M 1 à 3 j, L 3 à 5 j '
           f'(charge comptée {JOURS["S"]}, {JOURS["M"]} et {JOURS["L"]} j, pour une personne).', '',
           '| Lot | Tickets | P0 | Charge | Faits |', '|---|---:|---:|---:|---:|']
    total = 0
    for n, l in lots.items():
        j = sum(JOURS.get(t['taille'], 0) for t in l); total += j
        out.append(f"| [{l[0]['Lot']}](#lot-{n}) | {len(l)} | {sum(t['Priorité'] == 'P0' for t in l)} | {j} j | {sum(map(fait, l))} |")
    out.append(f'| **Total** | **{len(tickets)}** | **{sum(t["Priorité"] == "P0" for t in tickets.values())}** | **{total} j** | '
               f'**{sum(map(fait, tickets.values()))}** |')
    for n, l in lots.items():
        out += ['', f'<a id="lot-{n}"></a>', f"## {l[0]['Lot']}", '',
                '| Ticket | Priorité | Taille | Dépend de | Touche | Statut |', '|---|---|---|---|---|---|']
        out += [f"| [{t['id']} · {t['titre']}]({t['fichier']}) | {t['Priorité']} | {t['Taille']} | {t['Dépend de']} | {t['Touche']} | {t['Statut']} |" for t in l]
    return '\n'.join(out) + '\n'


if __name__ == '__main__':
    tickets, erreurs = charger()
    for e in erreurs:
        print('✗', e, file=sys.stderr)
    if '--verifier' in sys.argv:
        print(f'{len(tickets)} tickets, {len(erreurs)} problème(s)')
        sys.exit(1 if erreurs else 0)
    (T / 'README.md').write_text(index(tickets))
    print(f'tickets/README.md : {len(tickets)} tickets' + (f', {len(erreurs)} problème(s) ci-dessus' if erreurs else ''))
