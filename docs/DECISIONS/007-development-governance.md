# DEC-007 — Gouvernance de développement

- **Statut :** validée
- **Contexte :** le développement rapide par sessions d'agents IA a créé des décisions
  implicites et une dérive entre intention, documentation et code.

## Décision

Le processus de référence est :

`SPEC → PLAN → CODE → TEST → REVIEW`

Avant toute fonctionnalité importante, le ticket ou plan identifie la spécification et
les règles métier concernées. Une information manquante n'est pas inventée : elle est
marquée **DÉCISION REQUISE**, accompagnée des options et conséquences.

Les documents distinguent systématiquement :

- **FAIT** : vérifié dans le code ou explicitement établi ;
- **DÉCISION** : choix validé ;
- **HYPOTHÈSE** : supposition non confirmée ;
- **RECOMMANDATION** : proposition soumise au propriétaire.

Le code existant n'est jamais assimilé automatiquement à la cible. Toute contradiction
entre code et intention est inscrite dans l'analyse des écarts avant correction.

`AGENTS.md`, `CLAUDE.md` et `.claude/rules/` doivent être lus et respectés par les
agents. La documentation produit est indexée dans [`../README.md`](../README.md).

## Conséquences

- Une modification de stack répond à un problème concret et fait l'objet d'une
  décision explicite.
- Une correction de code ne se glisse pas dans une phase d'audit ou de spécification.
- Les tests et la revue du diff sont des conditions de vérification, pas des étapes
  facultatives.
