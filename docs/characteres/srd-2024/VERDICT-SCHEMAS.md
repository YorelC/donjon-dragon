# Verdict de cohérence des schémas — lot 2

Les schémas de `shared/src/` confrontés à la forme du SRD 5.2. La question posée était :
la structure du projet tient-elle face à celle du manuel ?

**Réponse courte : oui, et elle est souvent meilleure.** Une seule lacune réelle, une seule
correction de contenu.

---

## 1. `armorTraining` / `weaponProficiencies` contre `proficiencies[]` — le projet gagne

Le SRD range tout dans une liste plate et non typée, où cohabitent `light-armor`,
`simple-weapons` et `saving-throw-wis`. Le projet sépare les trois. C'est déjà mieux, mais
surtout le SRD **ne sait pas exprimer les règles 2024** :

| classe | projet | SRD 5.2 |
|---|---|---|
| moine | `['simple', 'martialLight']` | `['simple-weapons', 'scimitars', 'shortswords', 'hand-crossbows']` |
| roublard | `['simple', 'martialFinesseOrLight']` | `['simple-weapons', 'longswords', 'rapiers', 'scimitars', 'shortswords', 'whips', 'hand-crossbows']` |

En 2024 le moine maîtrise « les armes de guerre dotées de la propriété Légère », une règle
qui suit les armes ajoutées. Le SRD énumère à la place les listes nominatives de 2014.
`WeaponProficiencySchema` est le bon modèle.

**Verdict : ne rien changer.** Ces deux lignes restent en divergence permanente dans la
baseline, en `srd-faux`.

## 2. `CatalogStartingEquipmentSchema` contre `starting_equipment_options` — 1 pour 1

L'arbre du SRD (`options_array` → `multiple` → `counted_reference` / `money`) s'aplatit
exactement dans `{id, label, entries[{itemKey, quantity}], gold}`. Le `desc` du SRD devient
le `label`, les `counted_reference` deviennent les `entries`, le `money` devient le `gold`.

**Verdict : ne rien changer.** La forme du projet est celle du SRD, déjà aplatie.

## 3. `CatalogLineageSchema` contre `subspecies` — le projet gagne

Les `subspecies` du SRD sont des références nues `{index, name, url}`, sans mécanique. Le
`Lineage` du projet porte ses traits, leurs effets, et les `spellcastingAbilityOptions` dont
le SRD n'a aucun équivalent.

Nomenclature divergente, sans conséquence : le SRD préfixe (`elven-lineage-drow` pour
`drow`), et sur le goliath il nomme le trait quand le projet nomme le géant
(`giant-ancestry-clouds-jaunt` contre `cloud-giant`). L'audit compare donc le **nombre** de
lignées, pas les clés.

**Verdict : ne rien changer.**

## 4. Maîtrise d'arme 2024 — la seule lacune réelle

`5e-SRD-Weapon-Mastery-Properties.json` définit 8 maîtrises, et **les 38 armes du SRD en
portent une** :

```
topple ×5   vex ×8   slow ×7   nick ×4   sap ×6   graze ×2   cleave ×2   push ×4
```

`WeaponStatsSchema` (`shared/src/item-schema.ts`) ne modélise rien de tel, et
`items.seed.json` ne porte pas l'information. Or plusieurs classes reçoivent des maîtrises
**dès le niveau 1** — à confirmer classe par classe sur le PHB avant de chiffrer.

C'était le seul endroit où la structure du projet était en retrait sur les règles 2024.

**Verdict : ajoutée** (décision du 16/08/2026). `WeaponMasterySchema` rejoint le vocabulaire
fermé de `shared/src/dnd-reference-schema.ts`, `WeaponStatsSchema` gagne un champ `mastery`
nullable, et les 38 armes de `items.seed.json` sont renseignées. Le champ traverse aussi le
domaine back (`WEAPON_MASTERIES` dans `items/domain/item.ts`) et le sous-schéma Mongoose —
sans quoi Mongo aurait silencieusement effacé la valeur au seed.

### D'où viennent les valeurs

**Du SRD, contrairement à la règle générale — et c'est justifié.** `weapons.json` d'AideDD
ne porte aucune maîtrise : la donnée n'existe nulle part ailleurs dans le dépôt.

Avant de s'en servir, les valeurs du SRD ont été confrontées à seize armes dont la maîtrise
2024 est connue : hache d'armes, hache à deux mains, épée à deux mains, épée longue, dague,
rapière, maillet, marteau de guerre, hallebarde, coutille, cimeterre, épée courte, gourdin,
masse d'armes, bâton de combat, fléau. **Seize sur seize concordent.**

L'explication tient : la maîtrise est un concept introduit en 2024, sans équivalent en 2014.
Les erreurs du SRD portent toutes sur des champs qui existaient déjà en 2014 et ont été mal
reportés — prix, poids, dés, catégorie d'armure. La maîtrise, elle, a forcément été saisie
depuis du matériel 2024.

Le comparateur `weapon.mastery` est actif dans l'audit : si le SRD corrige une valeur ou si
le projet en change une, ça se verra.

## 5. Une correction de contenu : le roublard — corrigée

Seule divergence de tout l'audit où le projet avait tort.

`skillChoice.options` du roublard listait 10 compétences. Le PHB 2024 en donne **11** —
Représentation manquait, et un joueur ne pouvait donc pas la choisir.

L'erreur venait de la source : `docs/characteres/classes/rogue.json` avait déjà 10 options.
La transcription vers `back/src/modules/characters/domain/reference/classes.ts` était fidèle,
ce n'était pas une faute de recopie.

**Corrigée** (décision du 16/08/2026) dans les deux fichiers. L'audit confirme la disparition
de la divergence, et la baseline ne porte plus aucun `projet-faux`.

---

## Bilan de l'audit après le lot 2

| domaine | projet | SRD | appariés | divergences |
|---|---|---|---|---|
| items | 159 | 182 | 54 | 15 |
| species | 9 | 9 | 9 | 1 |
| classes | 12 | 12 | 12 | 4 |

20 divergences restantes : **19 en `srd-faux`, 1 en `srd-incomplet`** (le SRD ne donne pas de
taille au tieffelin, qui la choisit).

**Plus aucun `projet-faux`.** Sur les 21 désaccords trouvés, le projet avait raison 20 fois,
et le vingt-et-unième est corrigé.

## À part : les clés bilingues, revues de près

L'équipement de départ du roublard le montre en un coup d'œil — anglais et français dans la
même option :

```
leather, dagger, shortsword, shortbow, munitions, carquois,
outils-de-voleur, paquetage-de-cambrioleur
```

C'est la cause des 105 objets sur 159 que l'audit ne peut pas apparier. Chantier à part
entière : il touche `items.seed.json`, les paquetages de départ et les personnages déjà en
base (`armorKey`, `items[].itemKey`), donc une migration.
