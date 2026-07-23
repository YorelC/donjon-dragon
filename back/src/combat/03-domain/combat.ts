import { calculateModifier } from '../../character/03-domain/character.entity.js';
import type { DiceRollResult } from './dice.entity.js';
import { rollDice, checkCritical } from './dice.js';
import type {
  Combatant,
  AttackRoll,
  AttackResult,
  DamageRoll,
  CombatState,
} from './combat.entity.js';

export function rollInitiative(combatant: Combatant, rollResult: number): Combatant {
  const dexMod = calculateModifier(combatant.stats.dexterity);
  return { ...combatant, initiative: rollResult + dexMod };
}

export function sortByInitiative(combatants: Combatant[]): Combatant[] {
  return [...combatants].sort((a, b) => b.initiative - a.initiative);
}

export function buildTurnOrder(combatants: Combatant[]): string[] {
  return sortByInitiative(combatants).map((combatant) => combatant.id);
}

export function resolveAttack(
  attacker: Combatant,
  target: Combatant,
  roll: AttackRoll,
): AttackResult {
  const critical = checkCritical(roll.attackRoll);
  const hit = critical === 'success' || (critical !== 'failure' && roll.attackRoll >= target.armorClass);

  return {
    hit,
    critical,
    description: hit
      ? `${attacker.name} touche ${target.name}`
      : `${attacker.name} rate ${target.name}`,
  };
}

export function applyDamage(target: Combatant, damage: number): Combatant {
  return {
    ...target,
    hitPoints: {
      ...target.hitPoints,
      current: Math.max(0, target.hitPoints.current - damage),
    },
  };
}

export function rollDamage(damageRoll: DamageRoll, critical: boolean): DiceRollResult {
  const count = critical ? damageRoll.count * 2 : damageRoll.count;
  return rollDice(damageRoll.die, count, damageRoll.modifier);
}

export function nextTurn(state: CombatState): CombatState {
  const isLastTurn = state.currentTurnIndex === state.turnOrder.length - 1;
  return {
    ...state,
    currentTurnIndex: isLastTurn ? 0 : state.currentTurnIndex + 1,
    round: isLastTurn ? state.round + 1 : state.round,
  };
}

export function isCombatOver(state: CombatState): boolean {
  const aliveCount = state.participants.filter((p) => p.hitPoints.current > 0).length;
  return aliveCount <= 1;
}

export function endCombat(state: CombatState): CombatState {
  return { ...state, status: 'completed' };
}
