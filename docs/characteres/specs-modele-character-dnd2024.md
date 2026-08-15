# Spécifications — Modèles de données D&D 2024 (Architecture relationnelle + Multiclassage + Hiérarchie d'effets)

> **Destinataire :** Claude Code (agent de génération de code)
> **Objectif :** Spécifier les modèles MongoDB et classes TypeScript du système de personnage D&D 2024 : données de référence relationnelles, multiclassage complet, et une hiérarchie d'effets unique qui structure chaque règle (don, trait, capacité, sort, technique) selon son mode d'application.
> **Contexte technique :** Monorepo pnpm (`shared`, `back`, `front`), TypeScript strict, NestJS hexagonal, Zod partagé, React 18 + Vite.
> **Principe architectural :** Les données de référence vivent dans des collections dédiées, référencées par ID. Une règle changée = tous les personnages à jour. Chaque règle porte ses effets sous une forme structurée et classée.

---

## 1. Architecture des modèles

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Species │    │  Class   │    │Background│
│  (9 doc) │    │ (12 doc) │    │ (16 doc) │
└────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │
     │ speciesId     │ classLevels[] │ backgroundId
     ▼               ▼  (1+)        ▼
┌──────────────────────────────────────────────────┐
│                  Character                        │
│  classLevels: [ {classId, level, subclassId?} ]  │
│  spellcasting: { byClass: {...}, totalSlotsUsed }│
│  features: { barbarian: {...}, monk: {...} }     │
│  featIds[], equipment[]                          │
└────┬──────────────┬───────────────────────────────┘
     │              │
     ▼              ▼
┌──────────┐  ┌──────────┐
│   Feat   │  │  Spell   │
│ (75 doc) │  │ (390 doc)│
└──────────┘  └──────────┘
```

Tous les modèles de référence partagent le **modèle d'effet** décrit à la section 2.

---

## 2. Modèle générique d'effet (Feature & Effect)

### 2.1 Le principe

Toute règle qui donne quelque chose à un personnage — un trait d'espèce, une capacité de classe, un don, un sort, une maîtrise d'arme — se décompose en **une Feature** (la règle nommée) qui porte **un ou plusieurs Effect** (ses effets mécaniques). Chaque Effect a un **mode d'application** qui détermine ce que le système en fait.

### 2.2 Les cinq modes d'application

| Mode | Question | Traitement système | Exemples |
|---|---|---|---|
| `passive` | Toujours actif, modifie une valeur dérivée ? | Intégré aux formules, recalculé à la volée | Robuste, Vigilant, +1 FOR (Bagarreur), CA du moine |
| `grant` | Ajoute des éléments à la composition ? | Ajouté une fois à l'acquisition | Doué, Musicien, Initié à la magie, compétence d'espèce |
| `reactive` | Se déclenche automatiquement sur un événement ? | Écouté par le moteur, signalé au joueur | Relance halfelin, Endurance implacable (orc), Réactions |
| `active` | Le joueur choisit d'activer, coûte une ressource ? | Bouton d'action + compteur d'état | Rage, Ki, sorts, Conduit divin, Chanceux |
| `informational` | Aucun effet mécanique automatisable ? | Affiché en rappel uniquement | Sauvagerie martiale, Guérisseur (relance manuelle) |

**Frontière `reactive` / `informational` :** un effet est `reactive` si le système peut détecter l'événement et le signaler (ou l'appliquer) automatiquement. Il est `informational` si le déclenchement exige une décision du joueur en plein jet que le système ne peut pas trancher (relancer un dé, garder le meilleur).

### 2.3 Structure

```typescript
type EffectApplication =
  | 'passive' | 'grant' | 'reactive' | 'active' | 'informational';

type FeatureSource =
  | 'species' | 'class' | 'subclass' | 'background'
  | 'feat' | 'spell' | 'invocation' | 'fightingStyle' | 'weaponMastery';

type DamageType =
  | 'acid' | 'bludgeoning' | 'cold' | 'fire' | 'force' | 'lightning'
  | 'necrotic' | 'piercing' | 'poison' | 'psychic' | 'radiant'
  | 'slashing' | 'thunder';

type StateKey =
  | 'blinded' | 'charmed' | 'deafened' | 'frightened' | 'grappled'
  | 'incapacitated' | 'invisible' | 'paralyzed' | 'petrified' | 'poisoned'
  | 'prone' | 'restrained' | 'stunned' | 'unconscious' | 'exhausted'
  | 'raging' | 'concentrating' | 'hidden' | 'surprised';

// Mini-langage de conditions : prédicats structurés, combinables
type Condition =
  | { state: StateKey; equals: boolean }
  | { ability: Ability; op: 'gte' | 'lte' | 'eq'; value: number }
  | { level: number; op: 'gte' | 'lte' | 'eq'; value: number }
  | { hasFeature: string }
  | { hasProficiency: SkillName | Ability }
  | { weaponHasProperty: string }
  | { targetType: 'creature' | 'ally' | 'self' | 'object' }
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition };

interface Effect {
  application: EffectApplication;
  passive?: PassiveEffect;     // passive
  damage?: DamagePayload;      // dégâts (sorts, attaques)
  healing?: HealingPayload;    // soins
  condition?: ConditionPayload;// état imposé
  grants?: GrantPayload;       // grant
  trigger?: TriggerPayload;    // reactive / active
  resource?: ResourcePayload;  // active
  note?: string;               // informational + contexte
}

interface PassiveEffect {
  kind: 'bonus' | 'set' | 'advantage' | 'disadvantage'
      | 'resistance' | 'immunity' | 'vulnerability' | 'spellModifier';
  target?: EffectTarget;
  value?: string;
  damageType?: DamageType;
  spellKey?: string;
  spellAspect?: 'range' | 'damage' | 'duration' | 'targets' | 'castingTime';
  condition?: Condition;
}

interface DamagePayload {
  dice: string;                 // '8d6', '1d8'
  type: DamageType;
  attackRoll?: boolean;         // true si jet d'attaque
  save?: { ability: Ability; onSuccess: 'half' | 'none' | 'full' };
  perUpcastLevel?: string;      // dégâts ajoutés par niveau supérieur : '1d6'
}

interface HealingPayload {
  dice: string;                 // '2d8'
  abilityModifier?: Ability;
}

interface ConditionPayload {
  state: StateKey;
  duration?: string;            // 'jusqu'à la fin du sort', '1 minute'
  save?: { ability: Ability; onSuccess: 'none' | 'end' };
  endCondition?: Condition;
}

interface Feature {
  key: string;
  name: string;
  source: FeatureSource;
  description: string;
  effects: Effect[];
}

type EffectTarget =
  | 'maxHp' | 'armorClass' | 'initiative' | 'speed'
  | 'abilityScore' | 'attackBonus' | 'damage' | 'savingThrow'
  | 'unarmedDamage' | 'spellSaveDC' | 'skillCheck'
  | 'healing';

interface GrantPayload {
  skillProficiencies?: SkillName[];
  toolProficiencies?: string[];
  languageProficiencies?: string[];
  armorTraining?: string;
  weaponProficiencies?: string;
  spellcasting?: {
    type: 'virtualFeat' | 'full' | 'half' | 'pact' | 'third';
    classKey?: ClassKey;
    cantrips?: number;
    level1Spells?: number;
    multiclassSlotContribution?: 1 | 0.5 | 0.33 | 0;
  };
  grantSpell?: {             // « lance X sans emplacement » (invocations, dons, traits)
    spellKey: string;
    frequency: 'atWill' | 'oncePerLongRest' | 'oncePerShortRest';
    usesSlot: boolean;
  };
  feat?: string;             // key d'un don octroyé
  feature?: string;          // key d'une autre feature octroyée
}

interface TriggerPayload {
  event: TriggerEvent;
  timing?: 'before' | 'after' | 'instead';   // avant, après, ou à la place de l'événement
  action?: 'action' | 'bonusAction' | 'reaction' | 'free' | 'noAction';
  consumesReaction?: boolean;                 // true si l'effet consomme la réaction du tour
  frequency?: 'once' | 'oncePerTurn' | 'perShortRest' | 'perLongRest' | 'unlimited';
  condition?: Condition;
}

type TriggerEvent =
  // Jets de dés
  | 'onAttackRoll' | 'onDamageRoll' | 'onSavingThrow' | 'onAbilityCheck'
  | 'onSkillCheck' | 'onInitiativeRoll' | 'onDeathSavingThrow' | 'onHitDieRoll'
  // Combat
  | 'onAttack' | 'onHit' | 'onMiss' | 'onBeingHit' | 'onBeingAttacked'
  | 'onCrit' | 'onBeingCrit' | 'onKill' | 'onDamageTaken' | 'onDamageDealt'
  // Conditions et état
  | 'onDeath' | 'onUnconscious' | 'onConditionApplied' | 'onConditionRemoved'
  // Tour et temps
  | 'onTurnStart' | 'onTurnEnd' | 'onRoundStart' | 'onRoundEnd'
  | 'onCombatStart' | 'onCombatEnd'
  // Repos
  | 'onShortRest' | 'onLongRest' | 'onRestEnd'
  // Magie
  | 'onSpellCast' | 'onSpellTargeted' | 'onConcentrationCheck' | 'onConcentrationLost'
  // Déplacement
  | 'onMovement' | 'onEnteringArea' | 'onLeavingArea'
  // Réaction pure
  | 'onBeingTargeted' | 'onBeingMissed';

interface ResourcePayload {
  key: string;               // 'luckPoints', 'kiPoints', 'rageUses'
  max: string;               // 'proficiencyBonus', 'level', 'level / 2'...
  recovery: 'longRest' | 'shortRest' | 'never';
}
```

### 2.4 Règles de traitement par mode

| Mode | Au chargement | Pendant la partie | À la sauvegarde |
|---|---|---|---|
| `passive` | Appliqué dans les formules | Recalculé quand la source change | Rien (dérivé) |
| `grant` | Ajouté à la composition | Rien de plus | Les éléments accordés sont dans Character |
| `reactive` | Enregistré dans le moteur | Signalé/automatisé sur l'événement | Rien |
| `active` | Compteur initialisé | Décrémenté à l'usage | `features` persiste l'état |
| `informational` | Rien | Affiché comme rappel | Rien |

### 2.5 Catalogue des événements (TriggerEvent)

| Catégorie | Événement | Sens | Exemple d'usage |
|---|---|---|---|
| **Jets** | `onAttackRoll` | Un jet d'attaque est fait (par ou contre le perso) | Avantage, bonus d'attaque |
| | `onDamageRoll` | Un jet de dégâts est fait | Sauvagerie martiale (relance) |
| | `onSavingThrow` | Un jet de sauvegarde est fait | Bonus de JS, avantage |
| | `onAbilityCheck` | Test de caractéristique brut | Avantage Athlétisme (Goliath) |
| | `onSkillCheck` | Test de compétence | Expertise, expertise de voleur |
| | `onInitiativeRoll` | Jet d'initiative | Vigilant (bonus) |
| | `onDeathSavingThrow` | JS contre la mort | Avantage, immunité |
| | `onHitDieRoll` | Jet de dé de vie au repos | Bonus de soins |
| **Combat** | `onAttack` | Le perso déclare une attaque | Attaque sournoise |
| | `onHit` | Le perso touche une cible | Effets d'arme, Châtiment divin |
| | `onMiss` | Le perso rate | Relance, effets de raté |
| | `onBeingHit` | Le perso est touché | Bouclier, Parade |
| | `onBeingAttacked` | Le perso est ciblé par une attaque | Bouclier (réaction) |
| | `onCrit` | Coup critique porté | Effets critiques |
| | `onBeingCrit` | Coup critique subi | Réduction |
| | `onKill` | Le perso réduit une créature à 0 PV | Effets de mise à mort |
| | `onDamageTaken` | Le perso subit des dégâts | Endurance de la pierre (Goliath) |
| | `onDamageDealt` | Le perso inflige des dégâts | Bonus de dégâts |
| **Conditions** | `onDeath` | Le perso tombe à 0 PV | Endurance implacable (Orc) |
| | `onUnconscious` | Le perso devient inconscient | Effets d'éveil |
| | `onConditionApplied` | Un état est infligé au perso | Immunité, purge |
| | `onConditionRemoved` | Un état cesse | Effets de guérison |
| **Temps** | `onTurnStart` | Début du tour du perso | Régénération, effets de début de tour |
| | `onTurnEnd` | Fin du tour du perso | Fin de durée |
| | `onRoundStart` | Début du round de combat | Réinitialisation |
| | `onRoundEnd` | Fin du round | Effets de fin de round |
| | `onCombatStart` | Entrée en combat | Effets d'initiative |
| | `onCombatEnd` | Sortie de combat | Fin de Rage |
| **Repos** | `onShortRest` | Repos court pris | Récupération Ki, slots de pacte |
| | `onLongRest` | Repos long pris | Récupération complète |
| | `onRestEnd` | Fin de tout repos | Réinitialisation des ressources |
| **Magie** | `onSpellCast` | Le perso lance un sort | Compteurs de sorts |
| | `onSpellTargeted` | Le perso est ciblé par un sort | Contresort, absorptions |
| | `onConcentrationCheck` | JS de concentration requis | Bonus de concentration |
| | `onConcentrationLost` | Concentration brisée | Effets de rupture |
| **Déplacement** | `onMovement` | Le perso se déplace | Attaques d'opportunité |
| | `onEnteringArea` | Le perso entre dans une zone | Zone de sort |
| | `onLeavingArea` | Le perso quitte une zone | Zone de sort |
| **Réaction** | `onBeingTargeted` | Le perso est la cible d'un effet | Contresort |
| | `onBeingMissed` | Une attaque rate le perso | Riposte |

### 2.6 Règles sur `TriggerPayload`

- `timing: 'before'` : l'effet se résout avant l'événement (ex : avantage, bonus)
- `timing: 'after'` : l'effet se résout après (ex : dégâts supplémentaires)
- `timing: 'instead'` : l'effet remplace l'événement (ex : relance, remplacement de jet)
- `action: 'reaction'` + `consumesReaction: true` : l'effet consomme la réaction du tour
- `frequency` : borne l'effet dans le temps (ex : `oncePerTurn` pour Sauvagerie martiale)
- Un effet `reactive` sans `action` se déclenche automatiquement ; avec `action`, il propose au joueur de réagir

### 2.7 Résolution des effets sur Character

**Trois réalités distinctes :**

1. **Définition** (données de référence, immuable) : `Feat.effects[]`, `Class.progression[].features`, `Spell.effects[]`.
2. **État** (Mongo, mutable) : `abilities`, `classLevels[]`, `featIds[]`, `spellSlotsUsed`, ressources consommées.
3. **Résolu** (calculé à la volée, jamais stocké) : CA, PV max, attaques, sorts disponibles.

Un moteur passe de (1) + (2) vers (3). C'est le seul mouvement qui existe.

**Cycle de vie d'un effect :**

| Application | Traitement |
|---|---|
| `grant` | Appliqué une fois à l'acquisition, résultat persisté |
| `passive` | Recalculé à chaque résolution |
| `reactive` | Abonné au bus d'événements |
| `active` | Latent, état dans `features` |
| `informational` | Jamais appliqué |

**Provenance (non négociable) :** chaque effect collecté porte sa source, pour pouvoir le retirer quand elle disparaît (fin de Rage, sort dissipé).

```typescript
interface CollectedEffect {
  effect: Effect;
  source: {
    type: 'species' | 'class' | 'subclass' | 'feat' | 'invocation' | 'spell' | 'condition';
    key: string;
    id?: ObjectId;
  };
}
```

**Les quatre pièces du moteur :**

```
Collector        rassemble les effects de toutes les sources, avec provenance
GrantEngine      applique grant -> composition (maîtrises, sorts, compétences)
Resolver         applique passive -> valeurs dérivées (CA, PV, initiative)
ConflictResolver tranche les cumuls (set, max, non-cumul de statut)
EventBus         reactive/active -> déclenchements en jeu
```

**ComputedCharacter** (produit du moteur, jamais stocké) :

```typescript
interface ComputedCharacter {
  proficiencyBonus: number;
  maxHp: number;
  armorClass: number;
  initiative: number;
  speed: number;

  skillProficiencies: SkillName[];
  savingThrowProficiencies: Ability[];
  languages: string[];
  spellcasting: {
    slots: { total: Record<number, number>; used: Record<number, number> };
    cantripsKnown: string[];
    spellsPrepared: string[];
    atWillSpells: string[];          // grantSpell atWill
  };

  actions: ResolvedAction[];         // ex : Rage, avec coût et état branchés
  reactions: ResolvedReaction[];
  passives: ResolvedPassive[];       // pour l'affichage uniquement

  resources: Record<string, { current: number; max: number }>;
}
```

**Règles de cumul (ConflictResolver) :**

| Règle | Exemple | Logique |
|---|---|---|
| Additif | +2 PV, +1 CA, +CHA dégâts | On somme |
| Remplacement (`set`) | CA = 13 + DEX | Un seul `set` gagne ; priorité : armure > Défense sans armure > base |
| Maximum | Attaque supplémentaire (2, pas 3) | On garde le plus haut |
| Non-cumul de statut | Avantage + avantage | État booléen, pas additionnel |

**Choix persistés avec provenance :** les grants déterministes sont recalculés au chargement. Les grants « au choix » (ex : 3 compétences) sont persistés avec leur source dans `Character.choices`.

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

---

## 3. Modèle Species

Collection : `species`

```typescript
interface Species {
  _id: ObjectId;
  key: SpeciesKey;
  name: string;
  creatureType: 'humanoid';
  size: 'Small' | 'Medium';
  sizeMetric: string;
  speed: number;
  darkvision: number;
  features: Feature[];   // traits d'espèce, source='species'
}
```

### Les 9 espèces

| Clé | Nom | Taille | Vitesse | Vision nocturne |
|---|---|---|---|---|
| dragonborn | Drakéide | Medium | 9 m | 18 m |
| elf | Elfe | Medium | 9 m | 18 m |
| gnome | Gnome | Small | 9 m | 18 m |
| goliath | Goliath | Medium | 10,50 m | 0 |
| halfling | Halfelin | Small | 9 m | 0 |
| human | Humain | M ou P | 9 m | 0 |
| dwarf | Nain | Medium | 9 m | 18 m |
| orc | Orc | Medium | 9 m | 18 m |
| tiefling | Tieffelin | Medium | 9 m | 18 m |

### Traits par espèce, classés par mode

**Drakéide :**
- `breathWeapon` → `active` (ressource : utilisations = BM, repos long)
- `damageResistance` → `passive` (réduction de dégâts)
- `darkvision` → `passive`

**Elfe :**
- `keenSenses` → `grant` (maîtrise Perception)
- `feyAncestry` → `passive` (avantage JS, immunité sommeil)
- `trance` → `informational`
- `darkvision` → `passive`

**Halfelin :** `lucky` → `reactive` (relance des 1 naturels : le système détecte le 1 et signale), `brave` → `passive`
**Orc :** `relentlessEndurance` → `reactive` (événement `onDeath` : tomber à 1 PV)
**Goliath :** `stoneEndurance` → `reactive` (réduction dégâts, BM fois/repos long)
**Humain :** `versatile` → `grant` (1 compétence), `extraFeat` → `grant` (1 don d'Origine)
**Nain, Gnome, Tieffelin :** résistances et avantages → `passive` ou `reactive` selon la nature

---

## 4. Modèle Class

Collection : `classes`

```typescript
interface Class {
  _id: ObjectId;
  key: ClassKey;
  name: string;

  primaryAbility: Ability[];
  hitDie: 'd6' | 'd8' | 'd10' | 'd12';
  hpAtLevel1: number;
  savingThrows: Ability[];

  skillChoices: { count: number; from: SkillName[] };
  weaponProficiencies: string;
  armorTraining: string;
  toolProficiencies?: { count: number; options: string[] };

  multiclassPrerequisites: { ability: Ability; min: 13 }[];
  multiclassProficiencies: {
    armorTraining?: string;
    weaponProficiencies?: string;
    skillCount?: number;
    tools?: string;
    shields?: boolean;
  };

  startingEquipment: { options: EquipmentOption[]; defaultGold: number };

  spellcasting?: {
    ability: Ability;
    type: 'full' | 'half' | 'pact' | 'third';
    multiclassSlotContribution: 1 | 0.5 | 0.33 | 0;
    cantripsAtLevel1: number;
    preparedSpellsAtLevel1: number;
    spellList: SpellKey[];
  };

  progression: LevelEntry[];
  subclasses: Subclass[];
}

interface LevelEntry {
  level: number;
  proficiencyBonus: number;
  features: Feature[];       // capacités gagnées à ce niveau, source='class'
}

interface Subclass {
  key: string;
  name: string;
  description: string;
  features: { level: number; feature: Feature }[];  // source='subclass'
}
```

### Tableau des 12 classes

| Clé | Nom | Caractéristique | Dé vie | PV niv.1 | Prérequis multiclassage | Sorts | Contrib. slots |
|---|---|---|---|---|---|---|---|
| barbarian | Barbare | Force | d12 | 12 | FOR 13 | Non | — |
| bard | Barde | Charisme | d8 | 8 | CHA 13 | Complet (CHA) | 1 |
| cleric | Clerc | Sagesse | d8 | 8 | SAG 13 | Complet (SAG) | 1 |
| druid | Druide | Sagesse | d8 | 8 | SAG 13 | Complet (SAG) | 1 |
| sorcerer | Ensorceleur | Charisme | d6 | 6 | CHA 13 | Complet (CHA) | 1 |
| fighter | Guerrier | Force ou Dextérité | d10 | 10 | FOR 13 ou DEX 13 | Non (sauf EK) | 0.33 si EK |
| wizard | Magicien | Intelligence | d6 | 6 | INT 13 | Complet (INT) | 1 |
| monk | Moine | Dextérité et Sagesse | d8 | 8 | DEX 13 et SAG 13 | Non | — |
| warlock | Occultiste | Charisme | d8 | 8 | CHA 13 | Pacte (CHA) | 0 (pacte) |
| paladin | Paladin | Force et Charisme | d10 | 10 | FOR 13 et CHA 13 | Demi (CHA) | 0.5 |
| ranger | Rôdeur | Dextérité et Sagesse | d10 | 10 | DEX 13 et SAG 13 | Demi (SAG) | 0.5 |
| rogue | Roublard | Dextérité | d8 | 8 | DEX 13 | Non (sauf AT) | 0.33 si AT |

### Exemple : capacités du Barbare classées par mode

| Niveau | Capacité | Mode |
|---|---|---|
| 1 | Rage | `active` (ressource : rageUses) |
| 1 | Défense sans armure | `passive` (CA = 10+DEX+CON) |
| 1 | Bottes d'arme | `grant` (maîtrises d'arme) |
| 2 | Sens du danger | `reactive` (avantage JS DEX) |
| 2 | Témérité | `active` |
| 5 | Attaque supplémentaire | `passive` (2 attaques) |
| 5 | Déplacement rapide | `passive` |

### Sous-classes (4 par classe)

| Classe | Sous-classes |
|---|---|
| Barbare | Arbre-Monde, Berserker, Cœur sauvage, Zélateur |
| Barde | Danse, Savoir, Séduction, Vaillance |
| Clerc | Guerre, Lumière, Ruse, Vie |
| Druide | Étoiles, Terre, Lune, Mers |
| Ensorceleur | Psionique, Draconique, Cosmique, Sauvage |
| Guerrier | Champion, Chevalier occulte, Maître de guerre, Porteur de l'esprit |
| Magicien | Abjurateur, Devin, Évocateur, Illusionniste |
| Moine | Éléments, Main, Ombre, Paume |
| Occultiste | Archifée, Céleste, Fiélon, Grand Ancien |
| Paladin | Anciens, Dévotion, Gloire, Vengeance |
| Rôdeur | Belluaire, Chasseur, Traqueur des ténèbres, Marcheur des horizons |
| Roublard | Arnaqueur arcanique, Assassin, Voleur, Lame psionique |

---

## 5. Modèle Background

Collection : `backgrounds`

```typescript
interface Background {
  _id: ObjectId;
  key: BackgroundKey;
  name: string;
  abilityBonuses: Ability[];
  featId: ObjectId;
  skillProficiencies: SkillName[];
  toolProficiency: string;
  equipment: EquipmentOption[];
  defaultGold: number;
}
```

### Les 16 historiques

| Clé | Nom | Caractéristiques | Don | Compétences | Outil |
|---|---|---|---|---|---|
| acolyte | Acolyte | INT, SAG, CHA | Initié à la magie (Clerc) | Intuition, Religion | Matériel de calligraphe |
| artisan | Artisan | FOR, DEX, INT | Façonneur | Investigation, Persuasion | Outils d'artisan |
| artist | Artiste | FOR, DEX, CHA | Musicien | Acrobaties, Représentation | Instrument de musique |
| charlatan | Charlatan | DEX, CON, CHA | Doué | Escamotage, Tromperie | Matériel de contrefaçon |
| criminal | Criminel | DEX, CON, INT | Vigilant | Escamotage, Discrétion | Outils de voleur |
| hermit | Ermite | CON, SAG, CHA | Guérisseur | Médecine, Religion | Matériel d'herboriste |
| farmer | Fermier | FOR, CON, SAG | Robuste | Dressage, Nature | Outils de charpentier |
| guard | Garde | FOR, INT, SAG | Vigilant | Athlétisme, Perception | Boîte de jeux |
| guide | Guide | DEX, CON, SAG | Initié à la magie (Druide) | Discrétion, Survie | Outils de cartographe |
| merchant | Marchand | CON, INT, CHA | Chanceux | Dressage, Persuasion | Instruments de navigateur |
| sailor | Marin | FOR, DEX, SAG | Bagarreur de tavernes | Acrobaties, Perception | Instruments de navigateur |
| noble | Noble | FOR, INT, CHA | Doué | Histoire, Persuasion | Boîte de jeux |
| sage | Sage | CON, INT, SAG | Initié à la magie (Magicien) | Arcanes, Histoire | Matériel de calligraphe |
| scribe | Scribe | DEX, INT, SAG | Doué | Investigation, Perception | Matériel de calligraphe |
| soldier | Soldat | FOR, DEX, CON | Sauvagerie martiale | Athlétisme, Intimidation | Jeu |
| wayfarer | Voyageur | DEX, SAG, CHA | Chanceux | Discrétion, Intuition | Outils de voleur |

---

## 6. Modèle Feat

Collection : `feats`

```typescript
interface Feat {
  _id: ObjectId;
  key: FeatKey;
  name: string;
  category: 'origin' | 'general' | 'fightingStyle' | 'epicBoon';
  repeatable: boolean;
  prerequisites?: {
    minLevel?: number;
    minAbility?: { ability: Ability; value: number };
    requiresSpellcasting?: boolean;
    requiresFightingStyle?: boolean;
    requiresArmorTraining?: string;
  };
  description: string;
  effects: Effect[];    // le même modèle que partout ailleurs
}
```

### Les 10 dons d'origines, classés par mode

| Don | Mode(s) | Détail |
|---|---|---|
| Bagarreur de tavernes | `passive` + `grant` | +1 FOR/CON (`passive`), dégâts mains nues 1d4 (`passive`), repousser (`active`) |
| Chanceux | `active` | Ressource : points de chance = BM, repos long |
| Doué | `grant` | +3 compétences ou outils |
| Façonneur | `grant` + `informational` | +3 outils (`grant`), réduction 20% (`informational`) |
| Guérisseur | `informational` | Relance de soins manuelle |
| Initié à la magie | `grant` | Spellcasting virtuel (2 cantrips + 1 sort niv.1) |
| Musicien | `grant` | +3 instruments |
| Robuste | `passive` | maxHp += 2 × niveau |
| Sauvagerie martiale | `informational` | Relance dégâts manuelle |
| Vigilant | `passive` | initiative += bonus de maîtrise |

### Exemple de modélisation

```typescript
// Robuste
{
  key: 'tough',
  name: 'Robuste',
  category: 'origin',
  repeatable: false,
  effects: [
    {
      application: 'passive',
      target: 'maxHp',
      formula: '2 * level',
    }
  ]
}

// Vigilant
{
  key: 'alert',
  name: 'Vigilant',
  category: 'origin',
  effects: [
    {
      application: 'passive',
      target: 'initiative',
      formula: 'proficiencyBonus',
    }
  ]
}

// Bagarreur de tavernes
{
  key: 'tavernBrawler',
  name: 'Bagarreur de tavernes',
  category: 'origin',
  effects: [
    { application: 'passive', target: 'abilityScore', formula: '+1 strength' },
    { application: 'passive', target: 'unarmedDamage', formula: '1d4 + strength' },
    { application: 'active', trigger: { action: 'bonusAction' }, note: 'repousser 1,50 m' },
  ]
}

// Chanceux
{
  key: 'lucky',
  name: 'Chanceux',
  category: 'origin',
  effects: [
    {
      application: 'active',
      resource: { key: 'luckPoints', max: 'proficiencyBonus', recovery: 'longRest' },
      trigger: { event: 'onAttackRoll' },
      note: 'dépenser 1 point pour avantage',
    }
  ]
}

// Sauvagerie martiale
{
  key: 'savageAttacker',
  name: 'Sauvagerie martiale',
  category: 'origin',
  effects: [
    { application: 'informational', note: 'relancer les dés de dégâts 1×/tour, garder le meilleur' }
  ]
}
```

---

## 7. Modèle Spell

Collection : `spells`

Un sort est une Feature spécialisée : ses champs d'incantation lui sont propres, mais son effet suit le même modèle.

```typescript
interface Spell {
  _id: ObjectId;
  key: SpellKey;
  name: string;
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  school: 'abjuration' | 'conjuration' | 'divination' | 'enchantment'
         | 'evocation' | 'illusion' | 'necromancy' | 'transmutation';
  castingTime: string;       // '1 action', '1 bonus', '1 réaction'
  range: string;
  components: { verbal: boolean; somatic: boolean; material: string | null };
  duration: string;
  description: string;
  higherLevel?: string;
  classLists: ClassKey[];
  ritual: boolean;
  concentration: boolean;
  effects: Effect[];         // l'effet du sort, classé
}
```

**Classification typique :**
- Sort de dégâts (Boule de feu) → `active` (action, ressource : emplacement de sort)
- Sort défensif (Bouclier) → `reactive` (réaction, onBeingHit)
- Sort de buff (Armure de mage) → `passive` (CA) pour la durée
- Sort utilitaire (Porte) → `informational` (résolu par le MJ/narration)

> **Note :** La liste exhaustive des ~500 sorts sera chargée depuis un fichier JSON de seed.

---

## 8. Règles de multiclassage (extrait d'AideDD)

### 8.1 Prérequis et niveau total

- Prérequis : satisfaire ceux de la classe actuelle ET de la nouvelle (stocké dans `Class.multiclassPrerequisites`)
- **Niveau total** = somme de `classLevels[].level` ; **bonus de maîtrise** lu au niveau total ; PX basés sur le niveau total

### 8.2 PV et dés de vie

- PV gagnés selon le dé de vie de la classe choisie + CON
- Dés de vie additionnés par type, notés séparément (Paladin 5/Clerc 5 = 5d10 + 5d8)

### 8.3 Capacités qui ne se cumulent pas

| Capacité | Règle |
|---|---|
| Attaque supplémentaire | Ne se cumule pas (max 2, sauf Guerrier 11+ = 3, Guerrier 20 = 4) |
| Conduit divin | Utilisations se cumulent ; l'effet de chaque classe est accessible |
| Défense sans armure | Une seule formule (Barbare 10+DEX+CON, Moine 10+DEX+SAG) |
| Incantation | Voir 8.4 |

### 8.4 Incantation en multiclassage

**Formule du niveau de lanceur :**
```
casterLevel = floor(Σ full × 1) + floor(Σ half × 0.5) + floor(Σ third × 0.33)
```

**Table universelle des emplacements :**

| Niv. | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | — | — | — | — | — | — | — | — |
| 2 | 3 | — | — | — | — | — | — | — | — |
| 3 | 4 | 2 | — | — | — | — | — | — | — |
| 4 | 4 | 3 | — | — | — | — | — | — | — |
| 5 | 4 | 3 | 2 | — | — | — | — | — | — |
| 6 | 4 | 3 | 3 | — | — | — | — | — | — |
| 7 | 4 | 3 | 3 | 1 | — | — | — | — | — |
| 8 | 4 | 3 | 3 | 2 | — | — | — | — | — |
| 9 | 4 | 3 | 3 | 3 | 1 | — | — | — | — |
| 10 | 4 | 3 | 3 | 3 | 2 | — | — | — | — |
| 11 | 4 | 3 | 3 | 3 | 2 | 1 | — | — | — |
| 12 | 4 | 3 | 3 | 3 | 2 | 1 | — | — | — |
| 13 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | — | — |
| 14 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | — | — |
| 15 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | — |
| 16 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | — |
| 17 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | 1 |
| 18 | 4 | 3 | 3 | 3 | 3 | 1 | 1 | 1 | 1 |
| 19 | 4 | 3 | 3 | 3 | 3 | 2 | 1 | 1 | 1 |
| 20 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 1 | 1 |

**Magie de pacte :** slots de pacte indépendants de la table. Ils peuvent lancer des sorts d'autres classes, et inversement.

**Sorts connus/préparés :** chaque classe gère ses sorts séparément, avec sa caractéristique d'incantation. Les cantrips montent en puissance au niveau total.

---

## 9. Modèle Character

Collection : `characters`

```typescript
interface Character {
  _id: ObjectId;
  name: string;
  playerName: string;

  speciesId: ObjectId;
  backgroundId: ObjectId;
  featIds: ObjectId[];

  classLevels: {
    classId: ObjectId;
    level: number;
    subclassId?: ObjectId;
    hitDiceUsed: number;
  }[];

  abilities: Record<Ability, number>;
  alignment?: 'LG' | 'NG' | 'CG' | 'LN' | 'N' | 'CN' | 'LE' | 'NE' | 'CE';
  languages: string[];

  skillProficiencies: SkillName[];
  expertiseSkills: SkillName[];

  spellcasting: {
    byClass: Record<string, {
      ability: Ability;
      type: 'full' | 'half' | 'pact' | 'third' | 'virtualFeat';
      cantripsKnown: ObjectId[];
      spellsPrepared: ObjectId[];
      pactSlots?: { count: number; level: number; used: number };
    }>;
    totalSlotsUsed: Record<number, number>;
  };

  equipment: EquipmentItem[];
  gold: number;

  maxHp: number;
  currentHp: number;
  temporaryHp: number;
  armorClass: number;
  initiative: number;
  hitDice: Record<string, { total: number; used: number }>;

  // Ressources actives — groupées par source
  features: {
    [sourceKey: string]: {           // ex: "barbarian", "monk", "feat:lucky"
      [resourceKey: string]: { current: number; max: number } | boolean | number;
    };
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### Résolution des effets (CharacterResolver)

```typescript
function resolvePassiveEffects(character, refs): ComputedStats {
  // Parcourt toutes les Features (espèce + classes + dons + sorts actifs)
  // pour chaque Effect.application === 'passive', applique la formule
  return {
    maxHp: baseHp + toughBonus + conMod,
    initiative: dexMod + (hasAlert ? proficiencyBonus : 0),
    armorClass: ...,
    unarmedDamage: hasTavernBrawler ? '1d4+str' : '1+str',
  };
}

function resolveGrants(character, refs): void {
  // Applique les Effect.application === 'grant' à la création du personnage
  // → remplit skillProficiencies, languages, spellcasting.byClass, featIds
}

function resolveActiveResources(character, refs): void {
  // Initialise features[sourceKey][resourceKey] = { current: max, max }
  // depuis les Effect.application === 'active' portant une ressource
}
```

---

## 10. Cas concrets

### Cas 1 : Paladin 5 / Barde 3 (niveau total 8)

```
casterLevel = floor(5 × 0.5) + floor(3 × 1) = 2 + 3 = 5 → slots 4/3/2
```

### Cas 2 : Barbare 4 + don Initié à la magie (Druide)

```
casterLevel = 0 (ni Barbare ni le don ne contribuent)
→ pas de slots ; 2 cantrips à volonté ; sort niv.1 1×/repos long
```

### Cas 3 : Occultiste 2 / Barde 5 (niveau total 7)

```
casterLevel = 0 + 5 = 5 → slots standards 4/3/2
slots de pacte : 2 slots niv.1 (indépendants)
les deux pools peuvent lancer les sorts des deux classes
```

---

## 11. Validation Zod

- `classLevels` : ≥ 1 élément ; `level` 1-20 ; `subclassId` requis si `level ≥ 3`
- `totalLevel` (somme) : 1-20
- `abilities` : 3-20
- `languages` : ≥ 3, 'common' obligatoire
- `spellcasting.byClass` : clés = `classId` + `feat:<featId>`
- `spellcasting.totalSlotsUsed[level]` ≤ `totalSlots[level]` (calculé)
- `features` : clés = `classKey` des classes ou `feat:<featKey>` des dons actifs
- Prérequis de multiclassage vérifiés contre `abilities`
- Sorts préparés ∈ `Class.spellcasting.spellList` ; sorts de don ∈ niveau ≤ 1
- `hitDice` : types cohérents avec les classes

---

## 12. Types TypeScript partagés

```typescript
type Ability = 'strength' | 'dexterity' | 'constitution' | 'intelligence' | 'wisdom' | 'charisma';

type SkillName =
  | 'acrobatics' | 'animalHandling' | 'arcana' | 'athletics'
  | 'deception' | 'history' | 'insight' | 'intimidation'
  | 'investigation' | 'medicine' | 'nature' | 'perception'
  | 'performance' | 'persuasion' | 'religion' | 'sleightOfHand'
  | 'stealth' | 'survival';

type SpeciesKey = 'dragonborn' | 'elf' | 'gnome' | 'goliath' | 'halfling' | 'human' | 'dwarf' | 'orc' | 'tiefling';

type ClassKey =
  | 'barbarian' | 'bard' | 'cleric' | 'druid' | 'sorcerer' | 'fighter'
  | 'wizard' | 'monk' | 'warlock' | 'paladin' | 'ranger' | 'rogue';

type BackgroundKey =
  | 'acolyte' | 'artisan' | 'artist' | 'charlatan' | 'criminal'
  | 'hermit' | 'farmer' | 'guard' | 'guide' | 'merchant'
  | 'sailor' | 'noble' | 'sage' | 'scribe' | 'soldier' | 'wayfarer';

type FeatKey = 'alert' | 'crafter' | 'healer' | 'lucky' | 'magicInitiate'
  | 'musician' | 'savageAttacker' | 'skilled' | 'tavernBrawler' | 'tough';

type SpellKey = string;

type EffectApplication = 'passive' | 'grant' | 'reactive' | 'active' | 'informational';
```

---

## 13. Fichiers à créer

```
shared/src/character/
├── types.ts
├── effects/
│   ├── effect.ts               — Effect, EffectApplication, Feature, payloads
│   └── effect-target.ts        — EffectTarget et formules
├── schemas/
│   ├── abilities.schema.ts
│   ├── species.schema.ts
│   ├── class.schema.ts
│   ├── background.schema.ts
│   ├── feat.schema.ts
│   ├── spell.schema.ts
│   └── character.schema.ts
├── constants/
│   ├── skills.ts
│   ├── alignments.ts
│   ├── languages.ts
│   ├── abilityModifiers.ts
│   └── multiclass-slot-table.ts
├── seeds/
│   ├── species.seed.ts
│   ├── classes.seed.ts
│   ├── backgrounds.seed.ts
│   └── feats.seed.ts
├── resolvers/
│   ├── character-resolver.ts       — passif, grant, actif
│   ├── spellcasting-resolver.ts    — casterLevel, slots, pacte
│   └── effect-engine.ts            — applique un Effect selon son mode
└── index.ts
```

---

## 14. Ordre d'implémentation

1. **Types et constantes** — aucune dépendance
2. **Modèle Effect** (`effects/`) — le cœur, tout le reste en dépend
3. **Modèles de référence** (`species, class, background, feat, spell`) — utilisent Effect
4. **Seeds** — données PHB 2024, avec effets classés par mode
5. **Modèle Character** — dépend des modèles de référence
6. **Resolvers** — `effect-engine` applique chaque mode, `character-resolver` compose, `spellcasting-resolver` gère le multiclassage
7. **Validation Zod** — cohérence multiclassage + classification des effets
8. **Tests** — Vitest unitaires + cas concrets (Paladin/Barde, Occultiste/Barde, Barbare+Initié, dons passifs)

---

> **Documents associés :**
> - [Compétences](competences.md) — détail des 18 compétences
> - [Dons](dons.md) — catalogue complet des dons
> - [Sorts](sorts.md) — mécanique d'incantation et progression
> - [Source : AideDD - Règles 2024](https://www.aidedd.org/regles-24/)
> - [Source : Multiclassage](https://www.aidedd.org/regles/personnalisation/multiclassage/)