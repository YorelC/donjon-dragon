# Bugs

## Ouverts

### La fiche n'affiche aucun nom de sort

Quelle qu'en soit la source. `cantripsKnown` et `spellsPrepared` traversent bien le
contrat, puis sont jetés par la vue : `SpellcastingRow`
(`front/src/shared/components/character/character-features.view.tsx`) ne rend qu'origine,
DD, bonus d'attaque et emplacements.

Les sorts mineurs du magicien lui-même sont donc invisibles, tout comme celui de sa
lignée — qui est désormais correctement *compté*, mais toujours pas *nommé*.

Repéré en marge du bug du sort de lignée. Chantier de vue, sans impact sur le moteur.

---

## Corrigés

### ~~Création bloquée : clerc Thaumaturge avec Initié à la magie~~ — 16/08/2026

**Symptôme** — Clerc, Ordre divin Thaumaturge, historique Acolyte avec Initié à la magie.
L'étape annonçait 6 sorts mineurs (3 de classe + 1 de Thaumaturge + 2 du don), mais l'écran
de sélection n'en proposait que 5 : le +1 de Thaumaturge manquait côté classe. Le bouton
« suivant » restait bloqué, faute du compte attendu — **la création était impossible**.

**Cause** — Deux calculs concurrents. L'étape lisait `cantripQuotaOf`, qui appliquait bien
`extraCantripsOf` ; le sélecteur lisait directement `spellcasting.cantripsKnown` du
catalogue, qui ne l'appliquait pas.

**Correction** — `classCantripsOf` extraite dans
`front/.../builder/_internal/types/builder-lookups.ts` et lue par les deux. La divergence
n'est plus exprimable. Régression couverte par `builder-lookups.test.ts`.

### ~~Le sort mineur d'une lignée ne compte pas comme un sort connu~~ — 16/08/2026

**Symptôme** — Un magicien haut-elfe sortait avec
`cantripsKnown: ["fire-bolt", "light", "mage-hand"]` : Prestidigitation manquait, 3 sorts
mineurs au lieu de 4. Le sort n'était pas perdu pour autant — l'effet `grant.spells` était
bien produit par `cantripTrait` (`domain/reference/species.ts`) et bien collecté par
`collectEffects` avec sa provenance `lineage`, et il ressortait dans le bloc **Capacités**.
Il n'entrait simplement jamais dans `spellcasting`.

**Cause** — `domain/resolution/resolve-spellcasting.ts` ne connaissait que deux chemins,
`classSpellcasting` et `featSpellcasting`. Le chemin espèce / lignée n'avait jamais été
branché.

**Correction, back** — Troisième chemin `originSpellcasting`, qui lit les `grants.spells`
de source `species` / `lineage` et les rend comme une origine d'incantation à part entière.

**Correction, front** — L'étape Lignage demande désormais la caractéristique d'incantation
quand l'espèce en offre le choix (elfe, gnome, tieffelin), et ne se franchit pas sans elle.
Le choix voyage en `{source: {type: 'lineage'}, spellcastingAbility}` — le contrat le
supportait déjà. `CharacterBuildDetailSchema` gagne `lineageSpellcastingAbility` pour que
l'édition repeuple le champ.

Vérifié dans l'application : « suivant » bloqué à l'entrée de l'étape, encore bloqué avec
la lignée seule, franchissable une fois la caractéristique choisie.

**Dette laissée** — Un personnage créé avant cette étape n'a aucune caractéristique
enregistrée. `originAbility` retombe alors sur la première option de l'espèce
(Intelligence), le temps qu'il soit rejoué : le sort apparaît toujours, mais son DD peut
être faux sur un personnage ancien tant qu'il n'est pas ré-édité.
