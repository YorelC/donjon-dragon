# Documentation de référence

Ce dossier consolide la vision produit, la cible fonctionnelle, l'état vérifié du
repository et les décisions validées avec le propriétaire du produit au 23 août
2026.

Le code existant n'est jamais considéré automatiquement comme la spécification.
Une divergence entre le code et la cible est décrite dans
[`GAP-ANALYSIS.md`](./GAP-ANALYSIS.md), sans inventer de justification.

## Ordre de lecture normatif

1. [`CONTEXT.md`](./CONTEXT.md) — méthode et état des phases.
2. [`PRODUCT.md`](./PRODUCT.md) — problème, utilisateurs, valeur, MVP et vision future.
3. [`REQUIREMENTS.md`](./REQUIREMENTS.md) — exigences fonctionnelles validées.
4. [`DECISIONS/`](./DECISIONS/) — décisions produit et techniques structurantes.
5. [`DND-2024-COMPLIANCE-PLAN.md`](./DND-2024-COMPLIANCE-PLAN.md) — découpage de la
   matrice exhaustive des règles.
6. [`CURRENT-STATE.md`](./CURRENT-STATE.md) — cartographie factuelle du code existant.
7. [`GAP-ANALYSIS.md`](./GAP-ANALYSIS.md) — comparaison cible ↔ implémentation.
8. [`TRACEABILITY.md`](./TRACEABILITY.md) — correspondance exigences, code et tests.

[`HISTORY.md`](./HISTORY.md) fournit une synthèse chronologique. Les transcripts bruts
sont classés dans [`HISTORY/`](./HISTORY/) et ne font pas partie de la lecture normale.

Les documents techniques existants restent applicables dans leur périmètre :

- [`architecture-back.md`](./architecture-back.md) décrit l'architecture backend actuelle ;
- [`TECHNICAL-ARCHITECTURE-5A.md`](./TECHNICAL-ARCHITECTURE-5A.md) décrit la cible
  logique validée ;
- [`TECHNICAL-PERSISTENCE-5B.md`](./TECHNICAL-PERSISTENCE-5B.md) décrit le modèle
  MongoDB et la stratégie de persistance cibles ;
- [`TECHNICAL-RULE-MODEL-5C.md`](./TECHNICAL-RULE-MODEL-5C.md) fixe les principes
  validés et la conception détaillée provisoire du moteur de règles ;
- [`pipeline-hermes.md`](./pipeline-hermes.md) décrit le pipeline de développement ;
- [`adr/`](./adr/) contient les ADR techniques historiques ;
- [`.claude/rules/`](../.claude/rules/) contient les règles opérationnelles par couche.

## Vocabulaire de preuve

- **FAIT** : vérifié dans le code ou explicitement établi.
- **DÉCISION** : choix validé par le propriétaire du produit.
- **HYPOTHÈSE** : supposition non confirmée ; elle ne doit pas guider du code définitif.
- **RECOMMANDATION** : proposition non encore transformée en décision.
- **DÉCISION REQUISE** : choix manquant qui bloque ou peut modifier sensiblement la cible.

## Hiérarchie des sources

En cas de contradiction :

1. une décision produit validée et documentée définit la cible ;
2. une spécification fonctionnelle validée précise le comportement attendu ;
3. une décision technique acceptée précise la manière de construire ;
4. le code et les tests décrivent seulement l'état actuel ;
5. les documents historiques et transcripts ne justifient aucune divergence.

Un transcript est une preuve de provenance, pas une source normative. Lorsqu'une
décision historique est encore applicable, elle doit être lisible intégralement dans
la spécification ou le registre des décisions sans devoir consulter l'archive.

## État des phases

| Phase | État | Livrable |
|---|---|---|
| 1 — compréhension produit | Terminée | `PRODUCT.md`, `CONTEXT.md` |
| 2 — audit du repository | Terminée, lecture seule | `CURRENT-STATE.md` |
| 3 — analyse des écarts | Terminée | `GAP-ANALYSIS.md` |
| 4 — spécifications fonctionnelles système | Validées | `REQUIREMENTS.md` |
| 4 — matrice exhaustive des règles D&D 2024 | Terminée : B01 à B09 validés | `DND-2024-COMPLIANCE-PLAN.md` |
| 5A — architecture et modèle de calcul | Validée | `TECHNICAL-ARCHITECTURE-5A.md`, `DEC-015` |
| 5B — données et persistance MongoDB | Validée | `TECHNICAL-PERSISTENCE-5B.md`, `DEC-016` |
| 5C — modèle exécutable des règles | Principes et DR-5C-01 validés ; détails provisoires | `TECHNICAL-RULE-MODEL-5C.md`, `DEC-017` |
| 5D+ — contrats et infrastructure détaillés | Non commencée | API, temps réel, stockage binaire, observabilité et déploiement |
| 6 — documentation dans le repository | En cours | Présents documents |

## Règle de maintenance

Toute fonctionnalité importante suit :

```text
SPEC → PLAN → CODE → TEST → REVIEW
```

Un changement de comportement doit mettre à jour l'exigence et, si nécessaire,
la décision correspondante avant son implémentation.

## Actualiser la transcription locale

Le fil Codex local est stocké sous `.codex/sessions/` dans le profil utilisateur. La
transcription peut être régénérée sans exporter les données ChatGPT Web :

```powershell
pwsh ./docs/tools/export-codex-transcript.ps1 `
  -SessionPath "<chemin-vers-la-session.jsonl>" `
  -OutputPath "./docs/HISTORY/<date>-<sujet>.md"
```

Le générateur exclut les instructions système, contextes injectés, raisonnements
internes et appels d'outils. Comme le fichier de session continue d'évoluer pendant la
conversation, il faut relancer l'export après les derniers échanges à archiver.
