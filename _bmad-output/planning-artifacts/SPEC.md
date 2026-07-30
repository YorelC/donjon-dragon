---
title: SPEC — Donjon & Dragon V1
status: draft
date: 2026-07-19
version: 1
---

# SPEC — Spécification Formelle V1

> Projet **donjon-dragon** — RPG Donjon & Dragon / D&D 5e
> Stack : NestJS + MongoDB + Socket.IO (back) / React + Vite + Tailwind v4 + shadcn/ui + Zustand + TanStack Query (front)
> Paradigme : Hexagonal Architecture, Event-driven SPA avec UI optimiste

---

## 1. Architecture Globale

### 1.1 Structure du monorepo

```
donjon-dragon/
├── back/                          # NestJS backend
│   ├── src/
│   │   ├── character/             # Feature Character
│   │   │   ├── domain/            # Entités pures, ports
│   │   │   │   ├── character.entity.ts
│   │   │   │   ├── character.repository.port.ts
│   │   │   │   └── character-schema.ts       # Zod (partagé conceptuellement)
│   │   │   ├── application/       # Use-cases
│   │   │   │   ├── create-character.use-case.ts
│   │   │   │   └── get-character.use-case.ts
│   │   │   ├── infrastructure/    # Adaptateurs
│   │   │   │   ├── mongo-character.repository.ts
│   │   │   │   └── in-memory-character.repository.ts  # Fakes pour tests
│   │   │   └── interface/         # Controllers REST + WS
│   │   │       ├── character.controller.ts
│   │   │       └── character.module.ts
│   │   ├── combat/                # Feature Combat
│   │   │   ├── domain/
│   │   │   │   ├── dice.ts        # Fonctions pures de dés
│   │   │   │   ├── combat.ts      # Règles D&D 5e pures
│   │   │   │   ├── combat.entity.ts
│   │   │   │   └── combat.repository.port.ts
│   │   │   ├── application/
│   │   │   │   ├── roll-dice.use-case.ts
│   │   │   │   ├── start-combat.use-case.ts
│   │   │   │   └── resolve-turn.use-case.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── redis-combat-state.adapter.ts
│   │   │   │   └── in-memory-combat-state.adapter.ts
│   │   │   └── interface/
│   │   │       ├── combat.gateway.ts
│   │   │       └── combat.module.ts
│   │   ├── auth/
│   │   │   ├── domain/
│   │   │   ├── application/
│   │   │   ├── infrastructure/
│   │   │   └── interface/
│   │   └── shared/                # NestJS guards, filters, pipes communs
│   │       └── zod-validation.pipe.ts
│   └── test/                      # Tests Vitest backend
│       ├── unit/
│       ├── integration/
│       └── e2e/
├── front/                         # React SPA
│   ├── src/
│   │   ├── features/
│   │   │   ├── character/         # Feature Character
│   │   │   │   ├── character-form.container.tsx
│   │   │   │   ├── character-sheet.view.tsx
│   │   │   │   ├── character-form.view.tsx
│   │   │   │   ├── character-schema.ts         # Copie partagée du Zod
│   │   │   │   └── hooks/
│   │   │   │       └── use-character.ts
│   │   │   └── combat/            # Feature Combat
│   │   │       ├── combat-log.view.tsx
│   │   │       ├── dice-roller.view.tsx
│   │   │       ├── combat-initiative.view.tsx
│   │   │       └── hooks/
│   │   │           ├── use-dice.ts
│   │   │           └── use-combat.ts
│   │   ├── hooks/                 # Hooks partagés
│   │   │   └── use-websocket.ts
│   │   ├── lib/                   # Clients API, utilitaires
│   │   │   └── api.ts
│   │   ├── stores/                # Stores Zustand
│   │   │   ├── auth.store.ts
│   │   │   ├── character.store.ts
│   │   │   └── combat.store.ts
│   │   ├── pages/
│   │   │   ├── characters.page.tsx
│   │   │   └── combat.page.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── test/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   └── ...config files
├── shared/                        # Package partagé Zod
│   ├── src/
│   │   ├── character-schema.ts
│   │   ├── combat-schema.ts
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── docker-compose.yml
└── ...config files
```

### 1.2 Règles strictes (Code Quality Gates)

| Règle | Valeur |
|-------|--------|
| Fonctions | ≤ 20 lignes |
| Fichiers | ≤ 150 lignes |
| `any` | Interdit — utiliser `unknown` + type guards |
| Suffixes fichiers | `.controller.ts`, `.service.ts`, `.repository.ts`, `.container.tsx`, `.view.tsx`, `.test.ts` |
| Nommage fichiers | kebab-case |
| TDD | Tests AVANT code, chaque commit = RED → GREEN |
| Clean Code | Noms explicites, pas de commentaires superflus, SRP |
| Stepdown Rule | Dans un fichier, les fonctions/composants sont ordonnés du plus haut niveau d'abstraction vers le plus bas — la fonction "chef d'orchestre" en premier, ses détails/helpers en dessous, comme un article de journal (titre → résumé → détails). Convention *Clean Code*, Robert C. Martin. |
| Pas de route en dur | Routes front centralisées dans `ROUTES`, routes API/namespaces WS appelées par le front centralisées dans `API_ROUTES`/`WS_NAMESPACES`. Aucune chaîne littérale de route au point d'appel. |

### 1.3 Contrats d'interface

Toute communication entre couches passe par des **ports** (interfaces TypeScript). Les adaptateurs implémentent ces ports. Cela permet le test avec des **InMemory** fakes sans dépendre de MongoDB/Redis.

```
  Controller/UseCase
       │
       ▼
   Port (interface)      ← domain/
       │
       ▼
   Adapter (implement)   ← infrastructure/
```

---

## 2. Feature 1 : Création de Personnage

### 2.1 Objet métier

Un personnage D&D 5e est défini par :

| Champ | Type | Contrainte |
|-------|------|-----------|
| `id` | `string` (UUID v4) | Généré automatiquement |
| `name` | `string` | 2-50 caractères, regex `^[a-zA-ZÀ-ÿ '-]{2,50}$` |
| `race` | `enum` | `Human`, `Elf`, `Dwarf`, `Halfling`, `Dragonborn`, `Gnome`, `HalfElf`, `HalfOrc`, `Tiefling` |
| `class` | `enum` | `Barbarian`, `Bard`, `Cleric`, `Druid`, `Fighter`, `Monk`, `Paladin`, `Ranger`, `Rogue`, `Sorcerer`, `Warlock`, `Wizard` |
| `level` | `number` | 1–20, défaut 1 |
| `stats` | `Stats` | Voir ci-dessous |
| `hitPoints` | `number` | maxHP calculé, currentHP = maxHP au création |
| `armorClass` | `number` | 10 + mod Dexterité + équipement |
| `proficiencyBonus` | `number` | Calculé depuis level : `Math.ceil(1 + level / 4)` |
| `equipment` | `string[]` | IDs d'équipement SRD |
| `spells` | `string[]` | IDs de sorts SRD (si classe lanceuse) |
| `userId` | `string` | Propriétaire |
| `createdAt` | `string` (ISO 8601) | Auto |

**Stats block :**

| Stat | Abrév | Min | Max | Calcul mod |
|------|-------|-----|-----|-----------|
| Force | STR | 3 | 20 | `Math.floor((score - 10) / 2)` |
| Dexterité | DEX | 3 | 20 | idem |
| Constitution | CON | 3 | 20 | idem |
| Intelligence | INT | 3 | 20 | idem |
| Sagesse | WIS | 3 | 20 | idem |
| Charisme | CHA | 3 | 20 | idem |

### 2.2 Schéma Zod (shared/character-schema.ts)

```typescript
// shared/src/character-schema.ts

import { z } from 'zod';

export const RaceEnum = z.enum([
  'Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn',
  'Gnome', 'HalfElf', 'HalfOrc', 'Tiefling',
]);

export const ClassEnum = z.enum([
  'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter',
  'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer',
  'Warlock', 'Wizard',
]);

export const StatsSchema = z.object({
  strength: z.number().int().min(3).max(20),
  dexterity: z.number().int().min(3).max(20),
  constitution: z.number().int().min(3).max(20),
  intelligence: z.number().int().min(3).max(20),
  wisdom: z.number().int().min(3).max(20),
  charisma: z.number().int().min(3).max(20),
});

export const CreateCharacterSchema = z.object({
  name: z.string().min(2).max(50).regex(/^[a-zA-ZÀ-ÿ '-]{2,50}$/),
  race: RaceEnum,
  class: ClassEnum,
  level: z.number().int().min(1).max(20).default(1),
  stats: StatsSchema,
});

export const CharacterSchema = CreateCharacterSchema.extend({
  id: z.string().uuid(),
  hitPoints: z.number().int().positive(),
  armorClass: z.number().int().min(10),
  proficiencyBonus: z.number().int().min(2).max(6),
  equipment: z.array(z.string()),
  spells: z.array(z.string()),
  userId: z.string(),
  createdAt: z.string().datetime(),
});

export type CreateCharacterDto = z.infer<typeof CreateCharacterSchema>;
export type Character = z.infer<typeof CharacterSchema>;
export type Race = z.infer<typeof RaceEnum>;
export type Class = z.infer<typeof ClassEnum>;
export type Stats = z.infer<typeof StatsSchema>;
```

### 2.3 API REST

| Méthode | Path | Body/Query | Response | Auth |
|---------|------|-----------|----------|------|
| `POST` | `/api/characters` | `CreateCharacterDto` | `Character` (201) | full |
| `GET` | `/api/characters` | — | `Character[]` (200) | full/readonly |
| `GET` | `/api/characters/:id` | — | `Character` (200) / 404 | full/readonly |
| `DELETE` | `/api/characters/:id` | — | 204 | full |

### 2.4 Frontend — Caractéristiques

**Écran : Formulaire de création**
- Fields : name (text), race (select), class (select), level (number), stats (6 inputs number 3–20)
- Validation Zod côté client (même schéma partagé)
- Soumission → mutation TanStack Query → POST /api/characters
- Navigation vers la fiche personnage

**Écran : Fiche personnage**
- Affichage en read-only de toutes les stats
- Calculs : modificateurs, CA, bonus de maîtrise, HP max
- État chargement / erreur géré par TanStack Query
- Store Zustand : `currentCharacterId`, `charactersList`

### 2.5 Backend — NestJS

**CharacterController** (`character.controller.ts`)
- Valide le body avec `ZodValidationPipe`
- Appelle `CreateCharacterUseCase`
- Retourne le résultat ou 400/404/409

**CreateCharacterUseCase** (`create-character.use-case.ts`)
- Valide les règles métier (nom unique par user ? → deferred)
- Calcule hitPoints, armorClass, proficiencyBonus
- Persiste via `CharacterRepositoryPort`

**CharacterRepositoryPort** (`character.repository.port.ts`)
```typescript
export interface CharacterRepositoryPort {
  save(character: Character): Promise<Character>;
  findById(id: string): Promise<Character | null>;
  findAllByUserId(userId: string): Promise<Character[]>;
  delete(id: string): Promise<void>;
}
```

**MongoCharacterRepository** (`mongo-character.repository.ts`)
- Implémente `CharacterRepositoryPort`
- Mongoose schema + model, mappe vers/depuis l'entité domaine

**InMemoryCharacterRepository** (`in-memory-character.repository.ts`)
- Map<K,V> interne, utilisé dans les tests

### 2.6 Événements WebSocket (Character)

| Event | Direction | Payload | Déclencheur |
|-------|-----------|---------|-------------|
| `character:created` | Server → Client | `Character` | Après création |
| `character:deleted` | Server → Client | `{ id: string }` | Après suppression |

---

## 3. Feature 2 : Système de Combat D&D 5e

### 3.1 Architecture du module Combat

```
combat/
├── domain/
│   ├── dice.entity.ts          # Types pour les dés
│   ├── dice.ts                 # Fonctions pures : roll, rollWithAdvantage, etc.
│   ├── combat.entity.ts        # Combat, Round, Turn, Participant
│   ├── combat.ts               # Règles pures : init, attaque, dégâts, etc.
│   ├── combat.repository.port.ts
│   └── combat-schema.ts        # Zod partagé
├── application/
│   ├── roll-dice.use-case.ts
│   ├── start-combat.use-case.ts
│   └── resolve-turn.use-case.ts
├── infrastructure/
│   ├── redis-combat-state.adapter.ts
│   └── in-memory-combat-state.adapter.ts
└── interface/
    ├── combat.gateway.ts       # WebSocket gateway
    └── combat.module.ts
```

### 3.2 Système de Dés (domain/dice.ts)

Fonctions pures — pas d'I/O, pas d'effets de bord.

```typescript
// Types
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';
export interface DiceRoll {
  type: DiceType;
  result: number;
  label?: string;
}
export interface DiceRollResult {
  rolls: DiceRoll[];
  total: number;
  modifier: number;
  rawTotal: number;
  critical?: 'none' | 'success' | 'failure';
}

// Functions
export function roll(die: DiceType): DiceRoll;
export function rollDice(dice: DiceType, count: number, modifier?: number): DiceRollResult;
export function rollWithAdvantage(rollFn: () => number): { rolls: [number, number]; result: number };
export function rollWithDisadvantage(rollFn: () => number): { rolls: [number, number]; result: number };
export function checkCritical(d20Result: number): 'none' | 'success' | 'failure';
```

### 3.3 Règles de Combat (domain/combat.ts)

Fonctions pures — `(state, action) => newState`.

**Entités :**

```typescript
export interface Combatant {
  id: string;
  name: string;
  initiative: number;
  armorClass: number;
  hitPoints: { current: number; max: number };
  stats: Stats;
  conditions: Condition[];
}

export interface CombatState {
  id: string;
  roomId: string;
  participants: Combatant[];
  turnOrder: string[];          // IDs ordonnés par initiative
  currentTurnIndex: number;
  round: number;
  status: 'pending' | 'active' | 'paused' | 'completed';
  log: CombatLogEntry[];
}

export interface CombatLogEntry {
  turn: number;
  round: number;
  actorId: string;
  action: string;
  result: string;
  timestamp: string;
}
```

**Règles pure functions :**

```typescript
// Initiative
export function rollInitiative(combatant: Combatant, rollResult: number): Combatant;
export function sortByInitiative(combatants: Combatant[]): Combatant[];
export function buildTurnOrder(combatants: Combatant[]): string[];

// Attaque
export interface AttackRoll {
  attackerId: string;
  targetId: string;
  attackRoll: number;       // d20 + mod
  advantage?: 'none' | 'advantage' | 'disadvantage';
}

export interface AttackResult {
  hit: boolean;
  critical: 'none' | 'success' | 'failure';
  damage?: number;
  damageType?: string;
  description: string;
}

export function resolveAttack(
  attacker: Combatant,
  target: Combatant,
  roll: AttackRoll,
): AttackResult;

// Dégâts
export function applyDamage(
  target: Combatant,
  damage: number,
): Combatant;

export interface DamageRoll {
  dice: DiceType;
  count: number;
  modifier: number;
}

export function rollDamage(
  damageRoll: DamageRoll,
  critical: boolean,
): DiceRollResult;

// Tours
export function nextTurn(state: CombatState): CombatState;
export function previousTurn(state: CombatState): CombatState;
export function isCombatOver(state: CombatState): boolean;
export function endCombat(state: CombatState): CombatState;
```

### 3.4 WebSocket Gateway (combat.gateway.ts)

Un namespace Socket.IO par room. Tous les événements combat passent par WS.

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `combat:start` | Client → Server | `{ roomId, participantIds }` | Démarre un combat |
| `combat:started` | Server → Client | `CombatState` | Broadcast état initial |
| `combat:roll` | Client → Server | `{ diceType, count, modifier }` | Demande de jet |
| `combat:rolled` | Server → Client | `DiceRollResult` | Résultat du jet |
| `combat:attack` | Client → Server | `{ targetId, attackRoll }` | Attaque une cible |
| `combat:attack-resolved` | Server → Client | `{ attackerId, targetId, AttackResult }` | Résultat d'attaque |
| `combat:next-turn` | Client → Server | — | Passe au tour suivant |
| `combat:turn-changed` | Server → Client | `CombatState` | État après changement de tour |
| `combat:end` | Client → Server | — | Termine le combat |
| `combat:ended` | Server → Client | `CombatState` | État final |

**Flux typique d'une attaque :**

```
Player A                    Server                   Player(s) B
   │                         │                          │
   ├─ combat:attack ────────►│                          │
   │                         ├─ resolveAttack()         │
   │                         │  (pure function)         │
   │                         ├─ applyDamage()           │
   │                         │  (pure function)         │
   │                         ├─ nextTurn()              │
   │                         │                          │
   │ ◄── combat:attack-resolved ────────────────────────┤
   │ ◄── combat:turn-changed ───────────────────────────┤
```

### 3.5 État de Combat (Redis / InMemory)

Le combat state est **éphemère** — stocké en Redis (ou InMemory pour les tests). À la fin du combat, le log est persisté dans MongoDB `combat_log`.

```typescript
export interface CombatStatePort {
  get(combatId: string): Promise<CombatState | null>;
  save(combatId: string, state: CombatState): Promise<void>;
  delete(combatId: string): Promise<void>;
  addLogEntry(combatId: string, entry: CombatLogEntry): Promise<void>;
}
```

---

## 4. Contrats de Test

### 4.1 Tests Unitaires (domaine pur)

Tous les tests de `domain/` sont sans I/O, sans mock, sans dépendance.

| Fichier | Cible | Cas |
|---------|-------|-----|
| `dice.test.ts` | `roll()`, `rollDice()`, `rollWithAdvantage()`, `checkCritical()` | Distribution, bornes, edge cases |
| `combat.test.ts` | `rollInitiative()`, `resolveAttack()`, `applyDamage()`, `nextTurn()`, `isCombatOver()` | Scénarios complets |
| `character.entity.test.ts` | `createCharacter()`, `calculateModifier()`, `calculateHP()`, `calculateProficiencyBonus()` | Formules exactes |

### 4.2 Tests des Schémas Zod

| Fichier | Cible | Cas |
|---------|-------|-----|
| `character-schema.test.ts` | `CreateCharacterSchema`, `CharacterSchema` | Valides, invalides, edge cases |
| `combat-schema.test.ts` | `CombatStateSchema`, `AttackRollSchema` | Valides, invalides |

### 4.3 Tests d'Intégration (Repositories)

| Fichier | Cible | Cas |
|---------|-------|-----|
| `character.repository.test.ts` | `InMemoryCharacterRepository` | CRUD complet, find by id/userId, delete |
| `combat-state.test.ts` | `InMemoryCombatStateAdapter` | save/get/delete/addLogEntry |

### 4.4 Tests de Controllers / Gateways

| Fichier | Cible | Cas |
|---------|-------|-----|
| `character.controller.test.ts` | `CharacterController` (NestJS) | POST valide, POST invalide, GET list, GET by id, DELETE |
| `combat.gateway.test.ts` | `CombatGateway` (Socket.IO) | start, roll, attack, next-turn, end |

---

## 5. Règles de Développement

### 5.1 Processus TDD strict

1. **RED** : Écrire le test qui échoue (importe une fonction qui n'existe pas)
2. **Vérifier RED** : `pnpm test` → erreur `cannot find module`
3. **GREEN** : Implémenter le minimum pour passer
4. **Vérifier GREEN** : `pnpm test` → vert
5. **REFACTOR** : Nettoyer, garder les tests verts

### 5.2 Commandes de vérification

```bash
# Lancer tous les tests d'un module
pnpm test -- back/test/unit/dice.test.ts

# Type check
pnpm typecheck

# Lint
pnpm lint

# Tout ensemble (CI gate)
pnpm typecheck && pnpm lint && pnpm test
```

### 5.3 Structure des fichiers de test

Chaque fichier de test porte le suffixe `.test.ts` et se trouve dans :
- `back/test/unit/` pour les tests domaine purs
- `back/test/integration/` pour les tests avec adaptateurs InMemory
- `back/test/` pour les tests controllers/gateways NestJS

Le fichier test mirror la structure source :
```
src/character/domain/dice.ts
  → test/unit/character/domain/dice.test.ts

src/character/domain/character.entity.ts
  → test/unit/character/domain/character.entity.test.ts

src/character/infrastructure/mongo-character.repository.ts
  → test/integration/character/repository/character.repository.test.ts
  (via InMemoryCharacterRepository)

src/character/interface/character.controller.ts
  → test/character/character.controller.test.ts
```

---

## 6. Dépendances NPM à installer

### Backend (NestJS)

```json
{
  "@nestjs/core": "^10.x",
  "@nestjs/common": "^10.x",
  "@nestjs/platform-express": "^10.x",
  "@nestjs/platform-socket.io": "^10.x",
  "@nestjs/websockets": "^10.x",
  "@nestjs/mongoose": "^10.x",
  "mongoose": "^8.x",
  "socket.io": "^4.x",
  "zod": "^3.x",
  "redis": "^4.x",
  "reflect-metadata": "^0.2.x",
  "rxjs": "^7.x",
  "uuid": "^9.x"
}
```

### Dev Backend

```json
{
  "vitest": "^1.x",
  "@types/jest": "^29.x",
  "@types/node": "^20.x",
  "@types/uuid": "^9.x",
  "typescript": "^5.x"
}
```

### Frontend

```json
{
  "zustand": "^4.x",
  "@tanstack/react-query": "^5.x",
  "socket.io-client": "^4.x",
  "zod": "^3.x",
  "react-hook-form": "^7.x",
  "@hookform/resolvers": "^3.x"
}
```

### Shared

```json
{
  "zod": "^3.x"
}
```

---

## 7. Race / Class Stats (D&D 5e SRD)

### Modificateurs raciaux (V1 simplifié)

| Race | Modificateurs |
|------|-------------|
| Human | STR+1, DEX+1, CON+1, INT+1, WIS+1, CHA+1 |
| Elf | DEX+2, INT+1 |
| Dwarf | CON+2, STR+1 |
| Halfling | DEX+2 |
| Dragonborn | STR+2, CHA+1 |
| Gnome | INT+2 |
| HalfElf | CHA+2, +1 two of choice |
| HalfOrc | STR+2, CON+1 |
| Tiefling | CHA+2, INT+1 |

### Hit Dice par classe

| Classe | Hit Die | HP 1er niveau | HP niveaux suivants |
|--------|---------|---------------|-------------------|
| Barbarian | d12 | 12 + CON mod | 7 + CON mod (ou roll) |
| Bard, Cleric, Druid, Monk, Ranger, Warlock | d8 | 8 + CON mod | 5 + CON mod |
| Fighter, Paladin | d10 | 10 + CON mod | 6 + CON mod |
| Rogue | d8 | 8 + CON mod | 5 + CON mod |
| Sorcerer, Wizard | d6 | 6 + CON mod | 4 + CON mod |

---

## 8. Cas de test clés (edge cases)

| # | Scenario | Feature | Attendu |
|---|----------|---------|--------|
| 1 | Nom vide | Character | Erreur validation Zod |
| 2 | Stats hors bornes (STR=1) | Character | Erreur validation Zod |
| 3 | Classe invalide | Character | Erreur Zod enum |
| 4 | Création réussie → HP calculés | Character | HP = base classe + CON mod |
| 5 | d20 roll hors [1,20] | Dice | Impossible (pure function test) |
| 6 | Advantage → deux rolls, prend le meilleur | Dice | max(roll1, roll2) |
| 7 | Attaque touche si roll ≥ AC cible | Combat | hit=true |
| 8 | Attaque critique sur 20 | Combat | critical='success', dégâts doublés |
| 9 | Échec critique sur 1 | Combat | Échec automatique |
| 10 | Combat terminé si tous les HP ≤ 0 | Combat | status='completed' |
| 11 | Tour suivant dépasse dernier index → round+1 | Combat | round incrémenté, index=0 |
| 12 | getCharacter par id inexistant | Character | 404 |
| 13 | Suppression personnage inexistant | Character | 404 |
