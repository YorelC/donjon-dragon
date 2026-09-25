# Lot 2B — Maîtrises d'armes, outils et langues

> **Statut au 25 septembre 2026 : réalisé, document archivé.** Ce plan décrit
> l'état initial et le chemin suivi. La cible et le bilan à jour sont dans la
> Spec 009 : la langue supplémentaire du Roublard doit être distincte des deux
> langues standards, et le bilan domaine est de 74 règles conformes, 10
> partielles et 1 absente.

Plan d'implémentation révisé après audit du dépôt. Ce document est un plan de lot :
il n'est pas normatif. La cible normative reste `DEC-008` et
[`specs/009-level-one-character-creation.md`](../specs/009-level-one-character-creation.md),
que le chantier 1 complète avant toute écriture de code.

Vocabulaire de preuve : voir [`README.md`](./README.md).

## Objet

Ouvrir au wizard quatre choix que le serveur valide déjà, et supprimer les états
invalides laissés derrière eux par un changement de classe ou d'historique.

Le lot traite cinq classes à maîtrises d'armes, plus le Barde et le Moine pour les
outils : **sept** classes. Avec le Clerc, le Druide et l'Ensorceleur déjà praticables,
la capacité passe à **10 classes sur 12 potentiellement créables**. L'Occultiste et le
Magicien restent bloqués (lot 2C). « Potentiellement » ne tombe qu'une fois les
combinaisons dons + équipement prouvées.

## État vérifié du serveur

FAIT — la moitié serveur est commitée. `domain/resolution/class-options.ts` alimente à
la fois `validate-choices.ts` et le mapper de catalogue : le wizard ne peut donc pas
proposer ce que le serveur refuse, par construction et non par vigilance.

| Ce que le serveur publie | Portée | État |
|---|---|---|
| `CatalogClass.weaponMastery` | Barbare, Guerrier, Paladin, Rôdeur, Roublard | FAIT |
| `CatalogClass.toolChoice` | Barde (3), Moine (1) | FAIT |
| `CatalogClass.grantsLanguageChoice` | Roublard seul | FAIT |
| `CatalogBackground.toolOptions` | Artisan, Artiste, Garde, Noble, Soldat | FAIT |
| Détail : `weaponMasteries`, `classTools`, `backgroundTool` | Réouverture en édition | FAIT |
| Détail : `classLanguage` | Réouverture d'un Roublard | MANQUANT |
| Catalogue : `toolLabels`, `weaponLabels` | Nommer les options au front | MANQUANT |

FAIT — une divergence a été fermée en amont : `classes.ts` annonce que le Barde choisit
« trois outils quelconques » là où la validation n'accepte que des instruments de
musique. Un catalogue construit sur la table de référence aurait proposé vingt-cinq
outils dont vingt se seraient fait refuser à la création.

## Trous restants

### Les options n'ont pas de nom lisible

Les bornes du catalogue sont des clés nues : `{ count, options: string[] }`. L'étape
d'outils du Barde afficherait treize clés anglaises.

Ce n'est pas un trou de données : `TOOL_LABELS` tient déjà les 37 libellés français
dans `back/src/modules/characters/domain/reference/creation-options.ts`. C'est un trou
de publication — rien ne les expose au front.

### La langue du Roublard se perdrait à la réouverture

Elle vit dans le champ `languages` du choix de classe, et `classFieldsOf` ne la remonte
pas dans le DTO de détail. Rouvrir un Roublard le renverrait sans sa langue de classe,
et le `PUT` échouerait sur `assertLanguages`, qui en exige exactement une.

Elle sera typée `Language | null` : le quota est exactement un, jamais une liste, jamais
une chaîne libre.

## Décisions

### D1 — Provenance des libellés d'outils

DÉCISION — une table de libellés à la racine du catalogue, sur le modèle de
`skillLabels` déjà présent dans `DndCatalogSchema` : `toolLabels` et `weaponLabels`,
alimentés par `TOOL_LABELS` et par le référentiel `WEAPONS`.

Écarté, compléter `items.seed.json` : une maîtrise d'outil n'est pas un objet possédé,
les libellés existent déjà côté domaine, et le fichier est interdit sans accord
explicite.

Écarté, passer `CatalogBoundedChoice` en `{ key, name }` : cela duplique le nom à chaque
occurrence, laisse les outils des dons (Doué, Façonneur, Musicien) sans libellé, et
casse un schéma déjà consommé pour ne résoudre qu'une moitié du problème.

### D2 — Doublon de langue du Roublard

DÉCISION REQUISE — inscrite dans la Spec 009, non tranchée à ce jour.

FAIT — comportement actuel : `assertExactUnique` contrôle l'unicité *à l'intérieur* de
chaque lot, et `assertNoDuplicateProficiencies` ne couvre que les compétences et les
outils. Rien ne croise la langue de classe avec les deux langues standards. Un Roublard
peut donc prendre « elfique » deux fois : il gaspille un choix, le serveur l'accepte.

En attendant la décision, le comportement serveur reste inchangé et le front n'invente
rien : il ne grise pas l'option de son côté. Si la décision est de refuser le doublon,
validation serveur, filtrage front et tests des deux côtés arrivent dans le même commit.

### D3 — Emplacement du choix d'outil de l'historique

DÉCISION — étape conditionnelle propre, juste après `background`, comme les trois
autres. Un sous-choix noyé dans l'écran d'historique reproduirait l'aperçu refusé sans
raison lisible ; une étape visible avec son compteur rend le blocage compréhensible.

## Placement des étapes

Les quatre étapes sont conditionnelles et restent groupées derrière ce dont elles
dépendent. La langue de classe n'est pas ajoutée à l'étape des deux langues standards :
celle-ci précède le choix de classe, le wizard ne peut donc pas y savoir qu'il s'adresse
à un Roublard.

L'historique remonte avant les compétences de classe, et l'Expertise descend après les
dons. Le fil actuel produit trois défauts déjà lisibles dans le code :

- `ClassSkillsStepView` exclut les compétences d'historique via `knownSkillsExcept`,
  mais l'historique est encore `null` au premier passage ;
- `ExpertiseStepView` ne propose que `composition.classSkills`, là où `assertExpertise`
  autorise toute compétence maîtrisée — historique et dons compris (`B01-CLA-ROG`) ;
- un Barde peut prendre un instrument comme outil de classe puis le reprendre comme
  outil d'historique, que `assertNoDuplicateProficiencies` refusera.

Chaque étape doit donc voir tout ce dont sa validation dépend au moment où elle
s'affiche :

```
species › lineage › languages › class › background › [backgroundTool]
› classSkills › fightingStyle › classOrder › [weaponMasteries] › [classTools]
› [classLanguage] › feats › expertise › abilities › cantrips › spells
› equipment › identity
```

Ainsi les compétences de classe connaissent celles de l'historique, les outils de classe
connaissent l'outil d'historique, et l'Expertise connaît les compétences de toutes les
sources.

| Étape | Visible quand | Quota | Options |
|---|---|---|---|
| `weaponMasteries` | `class.weaponMastery !== null` | 2, et 3 pour le Guerrier | `weaponMastery.options` + `weaponLabels` |
| `classTools` | `class.toolChoice !== null` | `toolChoice.count` — Barde 3, Moine 1 | `toolChoice.options` + `toolLabels` |
| `classLanguage` | `class.grantsLanguageChoice` | exactement 1 | `languages.standard` ∪ `languages.rare` |
| `backgroundTool` | `background.toolOptions.length > 0` | exactement 1 | `toolOptions` + `toolLabels` |

## Matrice des remises à zéro

C'est le cœur du lot. Le blocage du lot 2A n'était pas un champ manquant : c'était un
champ resté peuplé après que sa cause a changé. Deux fonctions pures,
`classChangePatch` et `backgroundChangePatch`, remplacent le patch écrit à la main dans
`class-step.view.tsx`. Aucune vue ne calcule plus de remise à zéro.

| Champ | Dépend de | Traitement à la transition |
|---|---|---|
| `classSkills` | classe | vidé |
| `classCantrips`, `classSpells` | classe | vidés |
| `fightingStyle`, `classOrder` | classe | remis à `null` |
| `weaponMasteries` | classe | vidé |
| `classTools` | classe | vidé |
| `classLanguage` | classe | remis à `null` |
| `classEquipmentOptionId` | classe | remis à `null` |
| `armorKey`, `shield` | possession effective | recalculés, voir « Possession effective » ci-dessous |
| `expertise` | classe, historique *et* dons | vidé au changement de classe ; **filtré** sur les compétences encore maîtrisées au changement d'historique ou de don |
| `backgroundBonuses` | historique | vidé |
| `backgroundTool` | historique | remis à `null` |
| `backgroundEquipmentOptionId` | historique | remis à `null` |
| `speciesFeat` | historique | remis à `null` s'il duplique le don du nouvel historique et que ce don n'est pas répétable |
| `featSkills`, `featTools` | configuration de l'octroi de don | vidés quand la configuration change |
| `spellcastingAbility`, `spellList`, `featCantrips`, `featSpells` | configuration de l'octroi d'Initié à la magie | remis à zéro quand la configuration change |

### Le don ne se compare pas par sa clé

Comparer `oldFeat !== newFeat` ne suffit pas, et c'est le piège du lot.

FAIT — Acolyte, Guide et Sage accordent tous les trois `magic-initiate`, mais avec une
liste imposée différente : `cleric`, `druid`, `wizard`
(`BACKGROUNDS[key].originFeatSpellList`). Passer d'Acolyte à Guide laisse la clé du don
identique et rend pourtant invalides la liste, la caractéristique d'incantation, les
sorts mineurs et le sort de niveau 1 déjà choisis.

FAIT — un don peut aussi venir de l'*espèce* : l'Humain choisit le sien
(`speciesFeat`). L'octroi n'est donc pas une propriété de l'historique seul.

La transition compare la **configuration de l'octroi**, pas la clé :

```
originFeat + originFeatSpellList + clé de la source + speciesFeat éventuellement
invalidé par duplication
```

Tant que les choix sont à plat, la stratégie sûre est de remettre à zéro les choix du
don dès que la configuration de l'octroi change, quitte à demander à l'Humain de
ressaisir les siens. Cette perte contrôlée est assumée et documentée ici jusqu'au modèle
sourcé par `grantedBy` (lot 2C), qui permettra de savoir de quel octroi vient chaque
choix et donc de n'en invalider qu'une partie.

### Possession effective

« Encore présent dans un paquetage possible » ne suffit pas : l'armure portée doit venir
d'un paquetage **effectivement retenu après la transition**, pas d'une option disponible
de la nouvelle classe. Comme `classEquipmentOptionId` est justement remis à `null`, la
possession se recalcule au lieu de se deviner, avec les fonctions qui existent déjà dans
`starting-equipment.ts` :

- recalculer `grantedItems` depuis les paquetages encore sélectionnés ;
- conserver `armorKey` seulement s'il figure encore dans `ownedArmors` ;
- remettre `shield` à `false` si `ownedShield` ne rend plus rien.

## Les onze chantiers

La spec avant le contrat, le contrat avant le modèle, le modèle avant les écrans, les
écrans avant la preuve.

1. **Compléter la Spec 009** — matrice des quatre champs, provenance HTTP, matrice des
   remises à zéro, comportement en création et en édition, critères Given/When/Then, et
   la `DÉCISION REQUISE` D2. `DEC-008` n'est pas touchée : aucune décision produit ne
   change.
2. **Publier les libellés** — `toolLabels` et `weaponLabels` au schéma partagé et au
   mapper de catalogue, alimentés par le référentiel existant. Seed intact.
3. **Fermer le contrat de détail** — `classLanguage: Language | null` au schéma partagé
   et dans `character-build-detail.mapper.ts`, lu depuis le choix de source `class`.
4. **Étendre la composition front** — les quatre champs dans `CharacterComposition` et
   `EMPTY_COMPOSITION`.
5. **EXTRAIT — socle livré avant le lot** — `classChangePatch` et
   `backgroundChangePatch`, comparaison de la configuration du don et possession
   effective. Ce chantier appartient au socle préalable et ne doit pas être rejoué ici.
6. **EXTRAIT — socle livré avant le lot** — `background` avant `classSkills`,
   `expertise` après `feats`, et expertise ouverte à toute compétence maîtrisée. Ce
   chantier appartient au même socle préalable et ne doit pas être rejoué ici.
7. **Quatre écrans** — descripteurs (visibilité, validité, progression) puis vues, dans
   l'ordre du fil : outil d'historique, maîtrises d'armes, outils de classe, langue de
   classe. Chacune avec son compteur, et une validité qui contrôle quota, unicité et
   appartenance au catalogue.
8. **Émettre dans les payloads** — le choix de classe gagne `weaponMasteries`, `tools` et
   `languages` ; un choix de source `background` apparaît, portant son `tools`. C'est la
   première fois que le front émet une source d'historique.
9. **Réouverture fidèle** — les quatre champs relus du DTO de détail. Sans quoi éditer un
   Roublard ou un Barde détruit silencieusement ses choix, et le `PUT` les persiste.
10. **Preuve tabulaire** — voir ci-dessous.
11. **Playwright et gates** — parcours Roublard et Barde, puis `pnpm typecheck`,
    `pnpm lint`, `pnpm test` dans cet ordre, et Bruno sur le contrat.

## Preuve attendue

Deux parcours Playwright ne prouvent ni cinq familles de maîtrises, ni cinq historiques.
Ils valent comme smoke tests ; la couverture réelle est tabulaire. Chaque preuve est
rattachée à la couche qui l'établit, faute de quoi un refus serveur passe pour une
validation front.

| Preuve | Couche |
|---|---|
| Visibilité d'étape, quota, progression, options désactivées | tests front d'étape |
| Remises à zéro de classe et d'historique | tests unitaires des deux transitions |
| Composition → payload → schéma partagé | tests de contrat front |
| Valeur absente, excédentaire, dupliquée ou hors catalogue | domaine back |
| Détail → composition → `PUT` | tests de réhydratation |
| Zod HTTP et codes 400 | contrôleur et Bruno |
| Parcours utilisateur | Playwright, smoke |

La validité d'une nouvelle étape vérifie **quota, unicité et appartenance au catalogue**,
jamais le seul `array.length === count`.

Cas à couvrir :

- les cinq classes à maîtrises d'armes, quota et options ;
- Barde (trois outils) et Moine (un outil) ;
- les cinq historiques à outil au choix, et un des onze qui l'impose ;
- Roublard avec langue standard, puis avec langue rare ;
- Barde reprenant en outil d'historique un instrument déjà pris en outil de classe :
  refusé au front avant d'atteindre `assertNoDuplicateProficiencies` ;
- Acolyte avec Initié à la magie (liste Clerc), puis passage à Guide : liste,
  caractéristique, sorts mineurs et sort de niveau 1 remis à zéro ;
- expertise devenue orpheline après changement d'historique ou de don ;
- armure portée qui n'est plus effectivement possédée après changement de classe ;
- aller-retour DTO → composition → `PUT` sans perte sur les quatre champs.

Parcours Playwright : un Roublard (deux maîtrises, langue de classe, et **au moins une
Expertise portant sur une compétence d'historique** — sans quoi `B01-CLA-ROG` n'est pas
prouvée) et un Barde (trois instruments, distincts de son outil d'historique).

## Hors périmètre

- Occultiste et Magicien : invocations, sous-choix de pacte et grimoire relèvent du lot 2C.
- Dons d'origine multiples sourcés par `grantedBy` — ils débloqueront l'Humain à double
  Initié à la magie et permettront de savoir de quel don vient un choix.
- Objets concrets de paquetage et babiole : lot 2D.
- Pacte de la Lame absent des attaques calculées, `PUT` sans révision ni transaction,
  matrice combinatoire : inchangés.
- Le décompte des 85 règles B01 ne bouge pas : 72 conformes au domaine seulement,
  8 partielles, 5 absentes. La créabilité de bout en bout reste à prouver par
  combinaison, au lot 5.
