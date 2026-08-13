# Plan d'extraction des données de référence

Ordre d'exécution. Chaque extraction alimente une collection Mongo de référence, référencée par `Character` (architecture relationnelle de la spec).

| # | Source | URL | Seed | Collection | État |
|---|---|---|---|---|---|
| 1 | Sorts | `https://www.aidedd.org/spell/fr/` | `spells.seed.json` | `spells` | en cours |
| 2 | Dons | `https://www.aidedd.org/feat/fr/` | `feats.seed.json` | `feats` | à faire |
| 3 | Manifestations d'occultiste | `https://www.aidedd.org/invocation/fr/` | `invocations.seed.json` | `invocations` | à faire |

## Détail par source

### Sorts -> collection `spells`
Schéma : spec `specs-modele-character-dnd2024.md`, section 7 (Spell).
Agent : profil `json-extractor` (deepseek v4 flash).

### Dons -> collection `feats`
Schéma : spec section 6 (Feat, avec `effects: Effect[]` classés par mode).

### Manifestations d'occultiste -> collection `invocations`
Entité nouvelle, pas encore dans la spec. À modéliser au moment de l'extraction.

Esquisse de schéma :
```
{
  "key": string,                      // identifiant stable
  "name": string,                     // nom français
  "levelPrerequisite": number | null, // niveau d'occultiste requis
  "pactPrerequisite": string | null,  // ex "chain" "blade" "tome" "talisman"
  "effects": Effect[]                 // même modèle Feature/Effect que la spec
}
```

## Règle d'exécution

- Un seed par source, JSON valide, un tableau d'objets.
- Chaque extraction passe par l'agent `json-extractor`, avec un prompt dédié.
- Les URLs erronées se corrigent immédiatement (piège connu : pluriel `/spells/` = 404, singulier `/spell/` = 200).