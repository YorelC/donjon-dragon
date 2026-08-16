# Bug création clerc avec Thaumaturge et initié à la magie
Dans la création du personnage, quand je sélectionne un clerc ,que je prends l'ordre divin Thaumaturge, Je vois dans la Step view les orts mineur qui passent de 3 à 4 (normal)
Je continue, je prends l'historique Acolyte, je sélectionne initié à la magie, peut importe si c'est une sélection Clerc, Druide, Magicien, les deux sorts mineurs font passer la liste de Sorts mineurs à 6 dans la stemp view, ce qui est correct.
Mais quand j'arrive dans la liste des sorts mineurs, j'ai marqué 3 sort mineurs de classes et 2 sorts minieurs initié à la magie, il en manque un à choisir dans les sorts mineur de classe via Thaumaturge.
Cette erreur bloque la suite de la création du personnage car le bouton suivant est bloqué, car il manque le nombre attendu de sorts mineurs de classe à choisir.

# Le sort mineur d'une lignée ne compte pas comme un sort connu

Créer un elfe de lignée Haut-elfe. La lignée annonce « Le sort mineur
Prestidigitation, remplaçable par un autre sort mineur de magicien à chaque Repos
long ». Le sort n'apparaît nulle part dans les sorts du personnage.

Constaté sur une fiche calculée : un magicien haut-elfe sort avec
`cantripsKnown: ["fire-bolt", "light", "mage-hand"]`. Prestidigitation n'y est
pas — il devrait connaître 4 sorts mineurs, la fiche en compte 3.

Le sort n'est pas totalement perdu : l'effet `grant.spells` est bien produit par
`cantripTrait` (`domain/reference/species.ts`), bien collecté par
`collectEffects` avec sa provenance `lineage`, et il ressort sur la fiche dans le
bloc **Capacités**, comme une ligne « Prestidigitation — Haut-elfe » portant le
badge *Octroi*. Il n'entre simplement jamais dans `spellcasting`.

**Cause** : `domain/resolution/resolve-spellcasting.ts` ne connaît que deux
chemins, `classSpellcasting` et `featSpellcasting`. Le chemin espèce / lignée
n'a jamais été branché.

**Correction retenue** : donner un troisième chemin à `resolveSpellcasting`, qui
lit les sorts mineurs octroyés par les effets d'espèce et de lignée et les rend
comme une origine d'incantation à part entière.

Deux manques adjacents, à traiter avec :

- La fiche n'affiche **aucun nom de sort**, quelle qu'en soit la source.
  `cantripsKnown` et `spellsPrepared` traversent le contrat et sont jetés par la
  vue (`shared/components/character/character-features.view.tsx`, `SpellcastingRow`,
  qui ne rend qu'origine / DD / attaque / emplacements). Les sorts mineurs du
  magicien lui-même sont donc invisibles.
- La caractéristique d'incantation du sort de lignée n'est jamais demandée. Le
  catalogue publie pourtant `spellcastingAbilityOptions: ['intelligence',
  'wisdom', 'charisma']` pour l'elfe, le gnome et le tieffelin ; aucune étape du
  wizard ne la consomme. Sans elle, le DD et le bonus d'attaque de ce sort ne
  sont pas calculables.



