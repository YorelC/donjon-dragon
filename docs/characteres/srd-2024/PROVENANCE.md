# Provenance et fiabilité des données SRD vendorées

## Source

`https://github.com/5e-bits/5e-database`, dossier `src/2024/en`, récupéré le 16/08/2026.
18 fichiers JSON, ~1,1 Mo. Copie figée et commitée : aucun appel réseau au build ni au
runtime.

Code du dépôt sous licence MIT (`LICENSE.md`, Adrian Padua & Christopher Ward). La donnée
sous-jacente dérive du System Reference Document de Wizards of the Coast — SRD 5.2 pour le
dossier 2024, publié sous **Creative Commons Attribution 4.0**.

## Verdict de fiabilité : à ne PAS utiliser comme source primaire

L'audit du lot 0 (`scripts/srd/audit.ts` → `AUDIT.md`) a comparé les 54 objets appariables
entre `docs/characteres/equipment/items.seed.json` et ce SRD. Il sort **16 divergences**.

**Sur les 16, le projet a raison 16 fois.** Aucune divergence ne montre une erreur côté
projet.

La vérification a été faite par triangulation avec le SRD 5.1 (`src/2014/en` du même
dépôt), dataset mature :

| objet | projet (AideDD) | SRD 5.1 (2014) | SRD 5.2 (2024) |
|---|---|---|---|
| `dart` | 5 pc | 5 pc | **500 pc** |
| `javelin` | 50 pc | 50 pc | **500 pc** |
| `longbow` | 5 000 pc | 5 000 pc | **500 pc** |
| `spear` | 100 pc, 3 lb | 100 pc, 3 lb | **500 pc, 2 lb** |
| `mace` | 4 lb | 4 lb | **2 lb** |
| `pike` | 18 lb | 18 lb | **6 lb** |
| `sling` | 1d4 contondant | 1d4 contondant | **1d4 perforant** |
| `hide` | armure intermédiaire | Medium | **armure légère** |
| `chain-shirt` | 20 lb | 20 lb | **14 lb** |
| `hand-crossbow` | 75 po, 3 lb | absent | **25 po, 2 lb** |
| `robe` | 4 lb | absent | **1 lb** |

Sur les sept premières lignes, projet et SRD 5.1 sont d'accord et le fichier « 2024 » est
seul à diverger. Une fronde inflige des dégâts contondants et l'armure de peau est
intermédiaire dans les deux éditions : ce ne sont pas des changements de règle, ce sont des
erreurs de saisie.

Le `trident` va dans le même sens par l'autre bout : le projet dit 1d8 (polyvalent 1d10),
qui est la valeur du PHB 2024, là où le fichier « 2024 » de 5e-bits a conservé le 1d6/1d8
de 2014. Leur port 2024 n'est pas seulement fautif, il est **inachevé**.

Trois autres indices convergents :

- `5e-SRD-Monsters.json` (2024) contient **3 monstres**, contre ~330 en 2014.
- Il n'existe **aucun `5e-SRD-Spells.json`** dans `src/2024`.
- Seuls `en` et `pt-BR` existent en 2024 ; pas de `fr-FR`.

## Conséquence

Le SRD vendoré reste utile — comme **référence de contrôle** et comme **gabarit de forme**
(la structure `armor_class {base, dex_bonus, max_bonus}`, `damage {damage_dice,
damage_type}`, `starting_equipment_options` est bonne, ce sont les valeurs qui sont
fausses). Il ne peut pas servir de source primaire des valeurs.

Les données AideDD du projet sont, sur ce périmètre, plus exactes. L'audit change donc de
rôle : il ne sert plus à corriger le projet depuis le SRD, il sert à **signaler ce qu'il
faut aller vérifier à la main**, dans les deux sens.

## Lancer l'audit

```bash
cd back && pnpm exec tsx ../scripts/srd/audit.ts
```

Il régénère `AUDIT.md`, puis compare les divergences à `audit-baseline.json`.

Comme le SRD est fautif, exiger zéro divergence n'aurait pas de sens : il en resterait
quinze, toutes légitimes. L'audit exige donc l'inverse — **que la liste ne bouge pas**.
Sortie `0` si elle est identique à la baseline, `1` si une divergence apparaît, disparaît
ou change de valeur. Autrement dit : toute statistique du catalogue qu'on modifie devient
visible, et demande un arbitrage.

Après un arbitrage, on fige la nouvelle liste :

```bash
cd back && pnpm exec tsx ../scripts/srd/audit.ts --write-baseline
```

Les verdicts déjà rendus sont conservés ; les lignes nouvelles arrivent en `non-tranche` et
sont à relire. Les quinze lignes actuelles sont toutes en `srd-faux`.

Ce n'est **pas** branché au CI : le `CLAUDE.md` l'interdit et cette interdiction n'a pas
été levée.
