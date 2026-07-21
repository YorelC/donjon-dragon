---
title: Stories V1 — Donjon & Dragon
status: draft
date: 2026-07-19
version: 1
worker: Qwen
---

# Stories V1 — Donjon & Dragon

> Découpage en stories implémentables une par une.
> Chaque story = contrat complet (types/tests/spec courte).
> L'ouvrier implémente jusqu'à `pnpm typecheck && pnpm lint && pnpm test` vert.

## Ordre d'implémentation

Les stories sont ordonnées par dépendance. Chaque story suppose les précédentes terminées.

| # | Story | Dépend de | Temps estimé |
|---|-------|-----------|-------------|
| S01 | Setup monorepo + shared Zod | — | 30 min |
| S02 | Character entity (domaine pur) | S01 | 20 min |
| S03 | Dice system (domaine pur) | S01 | 20 min |
| S04 | Combat rules (domaine pur) | S03 | 30 min |
| S05 | Shared combat schemas | S01 | 15 min |
| S06 | InMemory repos (Character + Combat) | S02, S05 | 25 min |
| S07 | CreateCharacter use-case | S02, S06 | 15 min |
| S08 | CharacterController REST | S07 | 20 min |
| S09 | CombatGateway WebSocket | S04, S06 | 30 min |
| S10 | Frontend — Character features | S07, S08 | 40 min |
| S11 | Frontend — Combat features | S09 | 40 min |

---

## S01 — Setup monorepo + shared Zod

**Objectif :** Mettre en place le monorepo avec pnpm workspaces, NestJS backend, Vite frontend, et le package `@donjon-dragon/shared` avec les schémas Zod de base.

**Fichiers à créer :**
- `package.json` (racine) — pnpm workspace
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `shared/package.json`
- `shared/tsconfig.json`
- `shared/src/index.ts`
- `shared/src/character-schema.ts`
- `shared/src/combat-schema.ts`
- `back/package.json`
- `back/tsconfig.json`
- `back/src/main.ts` (NestJS bootstrap minimal)
- `back/vitest.config.ts`
- `front/package.json` (mise à jour)
- `front/vitest.config.ts`

**Tests :** Aucun pour cette story (setup). Vérifier avec :
```bash
pnpm install
pnpm typecheck
```

**Détail shared/src/character-schema.ts :**
```typescript
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

**Vérification :**
```bash
cd /c/_work/my_projects/donjon-dragon
pnpm install
pnpm typecheck
# Résultat attendu : 0 errors
```

---

## S02 — Character entity (domaine pur)

**Objectif :** Implémenter les fonctions pures de création de personnage :
- `calculateModifier(score: number): number`
- `calculateHitPoints(characterClass: Class, constitution: number, level: number): number`
- `calculateProficiencyBonus(level: number): number`
- `calculateArmorClass(dexterity: number): number`
- `createCharacter(params: CreateCharacterParams): Character`

**Fichiers :**
- Créer : `back/src/character/domain/character.entity.ts`
- Créer : `back/test/unit/character/domain/character.entity.test.ts`

**Règle :** Fonctions pures uniquement. Pas d'I/O, pas d'UUID (on le passe en paramètre, généré par le use-case).

**Tests à faire passer (tirés du test file) :**
- `calculateModifier(10) → 0`
- `calculateModifier(14) → 2`
- `calculateModifier(3) → -4`
- `calculateHitPoints('Fighter', 14, 1) → 14`
- `calculateHitPoints('Wizard', 10, 3) → 14`
- `calculateProficiencyBonus(1) → 2`
- `calculateProficiencyBonus(20) → 6`
- `calculateArmorClass(14) → 12`
- `createCharacter(...)` → objet complet avec tous les champs calculés

**Tables de correspondance :**

| Classe | Hit Die | HP niveau 1 | HP niveau N (N>1) |
|--------|---------|------------|-------------------|
| Barbarian | d12 | 12 + CON mod | 7 + CON mod |
| Bard | d8 | 8 + CON mod | 5 + CON mod |
| Cleric | d8 | 8 + CON mod | 5 + CON mod |
| Druid | d8 | 8 + CON mod | 5 + CON mod |
| Fighter | d10 | 10 + CON mod | 6 + CON mod |
| Monk | d8 | 8 + CON mod | 5 + CON mod |
| Paladin | d10 | 10 + CON mod | 6 + CON mod |
| Ranger | d8 | 8 + CON mod | 5 + CON mod |
| Rogue | d8 | 8 + CON mod | 5 + CON mod |
| Sorcerer | d6 | 6 + CON mod | 4 + CON mod |
| Warlock | d8 | 8 + CON mod | 5 + CON mod |
| Wizard | d6 | 6 + CON mod | 4 + CON mod |

**Modificateur :** `Math.floor((score - 10) / 2)`

**Proficiency Bonus :** `Math.ceil(1 + level / 4)`

**Vérification :**
```bash
pnpm test -- back/test/unit/character/domain/character.entity.test.ts
# Résultat attendu : all GREEN (sauf si character.entity.ts n'existe pas — RED d'abord)
```

---

## S03 — Dice system (domaine pur)

**Objectif :** Implémenter le système de dés D&D 5e :
- `roll(die: DiceType): DiceRoll`
- `rollDice(dice: DiceType, count: number, modifier?: number): DiceRollResult`
- `rollWithAdvantage(rollFn: () => number): { rolls: [number, number]; result: number }`
- `rollWithDisadvantage(rollFn: () => number): { rolls: [number, number]; result: number }`
- `checkCritical(d20Result: number): 'none' | 'success' | 'failure'`

**Fichiers :**
- Créer : `back/src/combat/domain/dice.entity.ts`
- Créer : `back/src/combat/domain/dice.ts`
- Créer : `back/test/unit/character/domain/dice.test.ts`

**Règles :**
- `roll(die)` utilise `Math.random()` × max + 1, arrondi à l'entier
- `rollWithAdvantage` lance la fonction 2 fois, prend `Math.max`
- `rollWithDisadvantage` lance la fonction 2 fois, prend `Math.min`
- `checkCritical(20) → 'success'`, `checkCritical(1) → 'failure'`
- Les fonctions sont **pures** modulo `Math.random()` — le seed est implicite

**Vérification :**
```bash
pnpm test -- back/test/unit/character/domain/dice.test.ts
```

---

## S04 — Combat rules (domaine pur)

**Objectif :** Implémenter les règles de combat D&D 5e :
- `rollInitiative(combatant, rollResult)` → combatant avec initiative
- `sortByInitiative(combatants)` → trié par initiative décroissante
- `buildTurnOrder(combatants)` → `string[]` d'IDs
- `resolveAttack(attacker, target, roll)` → `AttackResult`
- `applyDamage(target, damage)` → combatant avec HP réduits
- `rollDamage(damageRoll, critical)` → `DiceRollResult`
- `nextTurn(state)` → nouvel état avec index incrémenté
- `isCombatOver(state)` → boolean
- `endCombat(state)` → état avec status='completed'

**Fichiers :**
- Créer : `back/src/combat/domain/combat.entity.ts`
- Créer : `back/src/combat/domain/combat.ts`
- Créer : `back/test/unit/character/domain/combat.test.ts`

**Règles d'attaque :**
- `hit` si `attackRoll >= target.armorClass`
- Si l'attaque roll naturel est 20 → `critical='success'` (touche toujours, dégâts doublés)
- Si l'attaque roll naturel est 1 → `critical='failure'` (rate toujours)
- Sur critique, `rollDamage` double le nombre de dés

**Règles de tour :**
- Si `currentTurnIndex` est le dernier du `turnOrder` → retour à 0, round++
- Sinon → index+1

**Vérification :**
```bash
pnpm test -- back/test/unit/character/domain/combat.test.ts
```

---

## S05 — Shared combat schemas

**Objectif :** Ajouter les schémas Zod pour le combat dans `shared/`.

**Fichiers :**
- Modifier : `shared/src/combat-schema.ts`
- Créer : `back/test/unit/character/domain/combat-schema.test.ts` (dans le repo, pas ici)

**Schémas à ajouter dans combat-schema.ts :**
```typescript
import { z } from 'zod';

export const DiceTypeEnum = z.enum(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100']);
export const ConditionEnum = z.enum([
  'blinded', 'charmed', 'deafened', 'frightened', 'grappled',
  'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned',
  'prone', 'restrained', 'stunned', 'unconscious', 'exhaustion',
]);

export const HitPointsSchema = z.object({
  current: z.number().int().min(0),
  max: z.number().int().positive(),
}).refine(hp => hp.current <= hp.max, {
  message: 'current HP cannot exceed max HP',
});

export const CombatantSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
  initiative: z.number().int(),
  armorClass: z.number().int().min(1),
  hitPoints: HitPointsSchema,
  stats: StatsSchema,
  conditions: z.array(ConditionEnum),
});

export const AttackRollSchema = z.object({
  attackerId: z.string(),
  targetId: z.string(),
  attackRoll: z.number().int().min(1).max(30),
  advantage: z.enum(['none', 'advantage', 'disadvantage']).default('none'),
});

export const AttackResultSchema = z.object({
  hit: z.boolean(),
  critical: z.enum(['none', 'success', 'failure']),
  damage: z.number().int().nonnegative().optional(),
  damageType: z.string().optional(),
  description: z.string(),
});

export const CombatLogEntrySchema = z.object({
  turn: z.number().int().nonnegative(),
  round: z.number().int().positive(),
  actorId: z.string(),
  action: z.string(),
  result: z.string(),
  timestamp: z.string().datetime(),
});

export const CombatStateSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  participants: z.array(CombatantSchema),
  turnOrder: z.array(z.string()),
  currentTurnIndex: z.number().int().nonnegative(),
  round: z.number().int().positive(),
  status: z.enum(['pending', 'active', 'paused', 'completed']),
  log: z.array(CombatLogEntrySchema),
});

export type Combatant = z.infer<typeof CombatantSchema>;
export type AttackRoll = z.infer<typeof AttackRollSchema>;
export type AttackResult = z.infer<typeof AttackResultSchema>;
export type CombatState = z.infer<typeof CombatStateSchema>;
export type CombatLogEntry = z.infer<typeof CombatLogEntrySchema>;
```

**Vérification :**
```bash
pnpm typecheck
pnpm test -- back/test/unit/character/domain/combat-schema.test.ts
```

---

## S06 — InMemory repos (Character + Combat)

**Objectif :** Implémenter les adaptateurs InMemory pour les tests :
- `InMemoryCharacterRepository` implémente `CharacterRepositoryPort`
- `InMemoryCombatStateAdapter` implémente `CombatStatePort`

**Fichiers :**
- Créer : `back/src/character/domain/character.repository.port.ts`
- Créer : `back/src/character/infrastructure/in-memory-character.repository.ts`
- Créer : `back/src/combat/domain/combat.repository.port.ts`
- Créer : `back/src/combat/infrastructure/in-memory-combat-state.adapter.ts`
- Copier : `_bmad-output/planning-artifacts/tests/character.repository.test.ts` → `back/test/integration/character/repository/character.repository.test.ts`
- Copier : `_bmad-output/planning-artifacts/tests/combat-state.test.ts` → `back/test/integration/combat/combat-state.test.ts`

**CharacterRepositoryPort :**
```typescript
export interface CharacterRepositoryPort {
  save(character: Character): Promise<Character>;
  findById(id: string): Promise<Character | null>;
  findAllByUserId(userId: string): Promise<Character[]>;
  delete(id: string): Promise<void>;
}
```

**CombatStatePort :**
```typescript
export interface CombatStatePort {
  get(combatId: string): Promise<CombatState | null>;
  save(combatId: string, state: CombatState): Promise<void>;
  delete(combatId: string): Promise<void>;
  addLogEntry(combatId: string, entry: CombatLogEntry): Promise<void>;
}
```

**Vérification :**
```bash
pnpm test -- back/test/integration/character/repository/character.repository.test.ts
pnpm test -- back/test/integration/combat/combat-state.test.ts
```

---

## S07 — CreateCharacter use-case

**Objectif :** Implémenter le use-case de création de personnage.

**Fichiers :**
- Créer : `back/src/character/application/create-character.use-case.ts`
- Copier : `_bmad-output/planning-artifacts/tests/create-character.use-case.test.ts` → `back/test/unit/character/application/create-character.use-case.test.ts`

**Logique :**
1. Valide le DTO (via Zod, fait par le controller)
2. Génère un UUID v4 pour l'id
3. Crée l'entité Character via `createCharacter()`
4. Sauvegarde via `CharacterRepositoryPort`
5. Retourne le Character

```typescript
import { v4 as uuid } from 'uuid';
import { CharacterRepositoryPort } from '../domain/character.repository.port.js';
import { createCharacter } from '../domain/character.entity.js';
import type { CreateCharacterDto, Character } from '@donjon-dragon/shared/character-schema.js';

export class CreateCharacterUseCase {
  constructor(private readonly repo: CharacterRepositoryPort) {}

  async execute(dto: CreateCharacterDto, userId: string): Promise<Character> {
    const character = createCharacter({
      id: uuid(),
      ...dto,
      userId,
    });
    return this.repo.save(character);
  }
}
```

**Vérification :**
```bash
pnpm test -- back/test/unit/character/application/create-character.use-case.test.ts
```

---

## S08 — CharacterController REST

**Objectif :** Implémenter le controller NestJS pour l'API REST Character.

**Fichiers :**
- Créer : `back/src/character/application/get-character.use-case.ts`
- Créer : `back/src/character/interface/character.controller.ts`
- Créer : `back/src/character/interface/character.module.ts`
- Copier : `_bmad-output/planning-artifacts/tests/character.controller.test.ts` → `back/test/character/character.controller.test.ts`
- Copier : `_bmad-output/planning-artifacts/tests/character-schema.test.ts` → `back/test/unit/character/domain/character-schema.test.ts`

**Endpoints :**
| Méthode | Route | Handler | Description |
|---------|-------|---------|-------------|
| POST | `/api/characters` | `create(dto, userId)` | Crée un personnage |
| GET | `/api/characters` | `getAllByUser(userId)` | Liste les personnages |
| GET | `/api/characters/:id` | `getById(id)` | Détail d'un personnage |
| DELETE | `/api/characters/:id` | `delete(id)` | Supprime un personnage |

Le controller reçoit le `userId` depuis la requête (via un Guard JWT — on peut passer un userId mocké pour l'instant).

**Vérification :**
```bash
pnpm test -- back/test/character/character.controller.test.ts
pnpm test -- back/test/unit/character/domain/character-schema.test.ts
```

---

## S09 — CombatGateway WebSocket

**Objectif :** Implémenter le gateway Socket.IO pour le combat.

**Fichiers :**
- Créer : `back/src/combat/application/roll-dice.use-case.ts`
- Créer : `back/src/combat/application/start-combat.use-case.ts`
- Créer : `back/src/combat/application/resolve-turn.use-case.ts`
- Créer : `back/src/combat/interface/combat.gateway.ts`
- Créer : `back/src/combat/interface/combat.module.ts`
- Copier : `_bmad-output/planning-artifacts/tests/combat.gateway.test.ts` → `back/test/combat/combat.gateway.test.ts`

**Gateway events :**

| Event | Handler | Payload | Action |
|-------|---------|---------|--------|
| `combat:start` | `handleStart` | `{ roomId, participantIds }` | Crée CombatState, roll initiative, broadcast |
| `combat:roll` | `handleRoll` | `{ diceType, count, modifier }` | Lance les dés, retourne résultat |
| `combat:attack` | `handleAttack` | `{ combatId, attackerId, targetId, attackRoll, advantage }` | Résout attaque, applique dégâts, log |
| `combat:next-turn` | `handleNextTurn` | `{ combatId }` | Passe au tour suivant |
| `combat:end` | `handleEnd` | `{ combatId }` | Termine le combat |

Le gateway utilise le `CombatStatePort` pour persister/récupérer l'état.

**Vérification :**
```bash
pnpm test -- back/test/combat/combat.gateway.test.ts
```

---

## S10 — Frontend Character features

**Objectif :** Implémenter les pages et composants frontend pour la création et la visualisation des personnages.

**Fichiers :**
- Créer : `front/src/features/character/character-schema.ts` (copie du Zod partagé)
- Créer : `front/src/features/character/hooks/use-character.ts`
- Créer : `front/src/features/character/character-form.view.tsx`
- Créer : `front/src/features/character/character-form.container.tsx`
- Créer : `front/src/features/character/character-sheet.view.tsx`
- Créer : `front/src/stores/character.store.ts`
- Créer : `front/src/hooks/use-websocket.ts`
- Créer : `front/src/lib/api.ts`
- Créer : `front/src/pages/characters.page.tsx`
- Modifier : `front/src/App.tsx` (ajouter routes)

**Détails techniques :**

**use-character.ts (TanStack Query) :**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Character, CreateCharacterDto } from '../character-schema';

export function useCharacters(userId: string) {
  return useQuery({
    queryKey: ['characters', userId],
    queryFn: () => api.get<Character[]>(`/api/characters?userId=${userId}`),
  });
}

export function useCharacter(id: string) {
  return useQuery({
    queryKey: ['character', id],
    queryFn: () => api.get<Character>(`/api/characters/${id}`),
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCharacterDto) =>
      api.post<Character>('/api/characters', dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}
```

**character-form.view.tsx :**
- 6 champs number pour les stats (STR, DEX, CON, INT, WIS, CHA)
- Select pour Race (9 races)
- Select pour Classe (12 classes)
- Input text pour le nom
- Input number pour le niveau (1-20)
- Validation en temps réel avec Zod + react-hook-form + @hookform/resolvers
- Bouton submit → mutation

**Vérification :**
```bash
cd /c/_work/my_projects/donjon-dragon/front
pnpm typecheck
pnpm lint
```

---

## S11 — Frontend Combat features

**Objectif :** Implémenter les composants combat côté frontend avec WebSocket.

**Fichiers :**
- Créer : `front/src/features/combat/hooks/use-dice.ts`
- Créer : `front/src/features/combat/hooks/use-combat.ts`
- Créer : `front/src/features/combat/dice-roller.view.tsx`
- Créer : `front/src/features/combat/combat-initiative.view.tsx`
- Créer : `front/src/features/combat/combat-log.view.tsx`
- Créer : `front/src/stores/combat.store.ts`
- Créer : `front/src/pages/combat.page.tsx`
- Modifier : `front/src/App.tsx` (ajouter route /combat)

**Détails techniques :**

**combat.store.ts (Zustand) :**
```typescript
import { create } from 'zustand';
import type { CombatState } from '@donjon-dragon/shared/combat-schema';

interface CombatStore {
  currentCombat: CombatState | null;
  setCurrentCombat: (state: CombatState) => void;
  updateCombat: (partial: Partial<CombatState>) => void;
  clearCombat: () => void;
}

export const useCombatStore = create<CombatStore>((set) => ({
  currentCombat: null,
  setCurrentCombat: (state) => set({ currentCombat: state }),
  updateCombat: (partial) =>
    set((s) => ({
      currentCombat: s.currentCombat
        ? { ...s.currentCombat, ...partial }
        : null,
    })),
  clearCombat: () => set({ currentCombat: null }),
}));
```

**use-combat.ts (WebSocket hook) :**
```typescript
import { useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useCombatStore } from '../../stores/combat.store';

export function useCombat(roomId: string) {
  const { setCurrentCombat, updateCombat } = useCombatStore();

  useEffect(() => {
    const socket: Socket = io(`/room/${roomId}`, {
      transports: ['websocket'],
    });

    socket.on('combat:started', (state) => setCurrentCombat(state));
    socket.on('combat:attack-resolved', ({ combatId, result }) => {
      // Mise à jour optimiste via l'état broadcast
    });
    socket.on('combat:turn-changed', (state) => setCurrentCombat(state));
    socket.on('combat:ended', (state) => setCurrentCombat(state));

    return () => { socket.disconnect(); };
  }, [roomId]);

  const startCombat = useCallback((participantIds: string[]) => {
    // socket.emit('combat:start', { roomId, participantIds })
  }, [roomId]);

  const rollDice = useCallback((diceType: string, count: number, modifier = 0) => {
    // socket.emit('combat:roll', { diceType, count, modifier })
  }, []);

  const attack = useCallback((targetId: string, attackRoll: number) => {
    // socket.emit('combat:attack', { targetId, attackRoll })
  }, []);

  return { startCombat, rollDice, attack };
}
```

**Vérification :**
```bash
cd /c/_work/my_projects/donjon-dragon/front
pnpm typecheck
pnpm lint
```

---

## Commandes globales de vérification

```bash
# Après chaque story
cd /c/_work/my_projects/donjon-dragon

# TypeScript type check
pnpm typecheck

# Lint
pnpm lint

# Tests (Vitest)
pnpm test

# Les 3 gates pour valider une story
pnpm typecheck && pnpm lint && pnpm test
```

## Erreurs fréquentes et solutions

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Cannot find module '@donjon-dragon/shared'` | shared pas buildé | `pnpm --filter @donjon-dragon/shared build` |
| `TS2307: Cannot find module` | Mauvais chemin d'import | Vérifier les extensions `.js` et les paths tsconfig |
| `Type 'X' is not assignable to type 'Y'` | Zod infer mismatch | Vérifier `z.infer<>` et les champs optionnels |
| Test passe au premier lancement | Pas de RED initial | Supprimer l'implémentation, vérifier l'échec, réimplémenter |
| Fonction > 20 lignes | Violation règle projet | Extraire des sous-fonctions |
| Fichier > 150 lignes | Violation règle projet | Splitter en plusieurs fichiers |

> **Rappel TDD :** Chaque implémentation doit commencer par un test qui échoue (RED), puis le code minimal pour passer (GREEN), puis le refactoring si nécessaire. Ne jamais écrire de code avant le test.