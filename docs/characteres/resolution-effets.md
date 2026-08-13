# Moteur de résolution des effets

Ce document décrit comment le modèle `Effect` (voir la spec, section 2) est consommé par une classe `Character`. C'est la pièce qui transforme des données de référence déclaratives en un personnage jouable.

## Principe : trois objets, pas un

Il existe trois réalités distinctes, qu'il ne faut jamais confondre :

1. **La définition** (donnée de référence, immuable) : `Feat.effects[]`, `Class.progression[].features`, `Spell.effects[]`. Du JSON déclaratif, jamais modifié en jeu.
2. **L'état** (Mongo, mutable) : `abilities`, `classLevels[]`, `featIds[]`, `spellSlotsUsed`, ressources consommées, PV courants.
3. **Le résolu** (calculé à la volée, jamais stocké) : CA, PV max, attaques, liste des sorts disponibles.

Le moteur passe de (1) + (2) vers (3). C'est le seul mouvement qui existe.

## Cycle de vie d'un effect

Un effect traverse cinq états, chacun avec un traitement différent :

| État | Sens | Traitement |
|---|---|---|
| `grant` | Modifie la composition à l'acquisition | Appliqué une fois, résultat persisté |
| `passive` | Modifie une valeur dérivée en permanence | Recalculé à chaque résolution |
| `reactive` | Attend un événement | Abonné à un bus d'événements |
| `active` | Le joueur déclenche, coûte une ressource | Reste latent, état dans `features` |
| `informational` | Aucun effet système | Jamais appliqué |

`grant` et `passive` sont résolus ; `reactive` et `active` sont latents. Ce ne sont pas les mêmes circuits.

## Architecture : un moteur, quatre pièces

```
[Collector]     rassemble les effects de toutes les sources
                (espèce + classes + sous-classes + dons + invocations + sorts actifs + états)
        |
        +-- [GrantEngine]      applique grant -> composition (maîtrises, sorts, compétences)
        +-- [Resolver]         applique passive -> valeurs dérivées (CA, PV, initiative)
        +-- [ConflictResolver] tranche les cumuls (Défense sans armure, Attaque suppl.)
        +-- [EventBus]         reactive/active -> déclenchements en jeu
        |
        v
[ComputedCharacter]    l'objet jouable, produit à chaque chargement
```

- **Collector** : point d'entrée. Reçoit un Character et les références, sort la liste complète des effects avec leur provenance.
- **GrantEngine** : applique les grants à l'acquisition (ajoute compétences, sorts, maîtrises au Character).
- **Resolver** : applique les passifs, recalcule les valeurs dérivées.
- **ConflictResolver** : tranche les interactions entre effects qui touchent la même valeur.
- **EventBus** : émet et écoute les événements de jeu (attaque, dégât, début de tour, repos).

## La provenance, point non négociable

Un effect ne vaut rien sans la trace de son origine. Quand la Rage se termine ou qu'un sort se dissipe, il faut savoir exactement quoi retirer.

Chaque effect collecté porte sa source :

```typescript
interface CollectedEffect {
  effect: Effect;          // la définition
  source: {
    type: 'species' | 'class' | 'subclass' | 'feat' | 'invocation' | 'spell' | 'condition';
    key: string;           // ex : 'tieffelin', 'barbarian', 'rage'
    id?: ObjectId;
  };
}
```

Le `Character.features[]` actuel stocke l'état, mais pas le lien inverse vers la définition. C'est à corriger : chaque ressource consommée doit référencer sa source.

## Le ComputedCharacter

C'est le produit du moteur, l'objet que le frontend consomme pour afficher et jouer. Rien de ce qu'il contient n'est stocké : il se reconstruit à chaque chargement, en quelques millisecondes.

```typescript
interface ComputedCharacter {
  // valeurs dérivées
  proficiencyBonus: number;
  maxHp: number;
  armorClass: number;
  initiative: number;
  speed: number;

  // composition (résultat des grants)
  skillProficiencies: SkillName[];
  savingThrowProficiencies: Ability[];
  languages: string[];
  spellcasting: {
    slots: { total: Record<number, number>; used: Record<number, number> };
    cantripsKnown: string[];
    spellsPrepared: string[];
    atWillSpells: string[];          // grantSpell atWill
  };

  // capacités latentes, avec état branché
  actions: ResolvedAction[];         // ex : Rage, coût rageUses, état disponible/épuisée
  reactions: ResolvedReaction[];
  passives: ResolvedPassive[];       // pour l'affichage uniquement

  resources: Record<string, { current: number; max: number }>;
}
```

## Les règles de cumul, là où ça se joue

C'est le ConflictResolver, le cœur dur du moteur. Quatre familles :

| Règle | Exemple | Logique |
|---|---|---|
| **Additif** | +2 PV, +1 CA, +CHA dégâts | On somme tout |
| **Remplacement** | CA = 13 + DEX (Armure de mage) | Un seul `set` gagne, selon une priorité |
| **Maximum** | Attaque supplémentaire (2, pas 3) | On garde le plus haut |
| **Non-cumul de statut** | Avantage + avantage = avantage | L'état est booléen, pas additionnel |

Le `set` exige une priorité explicite : armure > Défense sans armure > base. Sinon un moine barbare aura une CA absurde.

## Décisions tranchées

1. **Conditions dynamiques** : mini-langage structuré `Condition` (prédicats `state`, `ability`, `level`, `hasFeature` + opérateurs `all` / `any` / `not`), et `StateKey` énumérant tous les états.
2. **Payload des sorts** : `DamagePayload` (dés, type, jet de sauvegarde, bonus par niveau supérieur), `HealingPayload`, `ConditionPayload`, distincts de `passive.kind = bonus`.
3. **Provenance des grants** : les grants déterministes sont recalculés ; les grants « au choix » sont persistés avec leur source dans `Character.choices`.

```typescript
interface Character {
  // ... autres champs ...
  choices: {
    source: { type: 'feat' | 'class' | 'background' | 'species'; key: string; id?: ObjectId };
    skills?: SkillName[];
    tools?: string[];
    spells?: string[];
  }[];
}
```

Le GrantEngine lit `choices` au chargement et les intègre à la composition. Retirer la source retire les choix.
