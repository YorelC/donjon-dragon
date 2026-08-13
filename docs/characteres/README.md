# Documentation — Création de personnage D&D 2024

> **Dernière mise à jour :** 2026-08-13
> **Architecture :** Relationnelle + Multiclassage + Hiérarchie d'effets (Feature/Effect)
> **Source :** [AideDD - Règles 2024](https://www.aidedd.org/regles-24/)

## Structure documentaire

```
docs/characteres/
├── README.md                                    ← ce fichier
├── specs-modele-character-dnd2024.md            ← SPEC PRINCIPALE : architecture, effets, multiclassage, modèles, Zod
├── competences.md                               ← 18 compétences + jets de sauvegarde
├── dons.md                                      ← 10 dons d'origines + catalogue complet
└── sorts.md                                     ← Mécanique d'incantation + progression emplacements
```

## Les trois piliers de la spec

1. **Référence vs état** — les règles vivent dans des collections dédiées, Character ne stocke que l'état mutable
2. **Hiérarchie d'effets** — toute règle est une `Feature` portant des `Effect` classés par mode d'application
3. **Multiclassage** — `classLevels[]`, spellcasting par classe, table universelle des emplacements

## Les cinq modes d'application d'un effet

| Mode | Traitement système |
|---|---|
| `passive` | Intégré aux formules, recalculé à la volée |
| `grant` | Ajouté une fois à la composition |
| `reactive` | Signalé/automatisé sur un événement |
| `active` | Bouton d'action + compteur d'état |
| `informational` | Affiché en rappel uniquement |

## Ce qui est complet

- 12 classes avec progression niveau 1-20 + prérequis et maîtrises de multiclassage
- 9 espèces avec traits classés par mode
- 16 historiques avec dons/compétences/outils
- 18 compétences avec mapping caractéristique
- 10 dons d'origines classés par mode (passive/grant/active/informational)
- Table universelle des emplacements multiclassage (niveau lanceur 1-20)
- Règles de cumul/non-cumul (Attaque supplémentaire, Conduit divin, Défense sans armure)
- 3 cas concrets modélisés (Paladin/Barde, Barbare+Initié, Occultiste/Barde)

## Ce qui reste optionnel

- **Liste exhaustive des sorts** (~500) → fichier JSON de seed
- **Effets détaillés** des dons → pages individuelles aidedd.org/feat/fr/
- **Capacités de sous-classe** niveau par niveau → pages de classe