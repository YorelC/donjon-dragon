import type { Ability } from '../reference/abilities';
import type { CollectedEffect, PassiveEffect } from '../reference/effect';
import type { ResolvedAttack } from './resolve-attacks';
import type { FormulaContext } from './evaluate-formula';

const UNARMED_STRIKE_KEY = 'unarmed-strike';
const UNARMED_STRIKE_NAME = 'Frappe à mains nues';
const UNARMED_DAMAGE_TYPE = 'bludgeoning';

/** La Frappe à mains nues inflige 1 dégât, plus la Force, sauf si un trait la remplace. */
const DEFAULT_UNARMED_DAMAGE = 1;

/**
 * La Frappe à mains nues, que tout personnage sait porter (PHB 2024) : toujours
 * maîtrisée, en Force. Un effet peut en remplacer le dé — Arts martiaux,
 * Combat à mains nues, Bagarreur de tavernes — et, pour le Moine, autoriser la
 * Dextérité : la meilleure des deux est alors retenue.
 */
export function resolveUnarmedStrike(
  effects: readonly CollectedEffect[],
  context: FormulaContext,
): ResolvedAttack {
  const replacement = unarmedReplacementOf(effects);
  const ability = unarmedAbility(replacement, context);
  const modifier = context.abilityModifiers[ability];

  return {
    weaponKey: UNARMED_STRIKE_KEY,
    name: UNARMED_STRIKE_NAME,
    ability,
    attackBonus: modifier + context.proficiencyBonus,
    damage: unarmedDamage(replacement?.dice, modifier),
    damageType: UNARMED_DAMAGE_TYPE,
    range: null,
    proficient: true,
    mastery: false,
    source: 'unarmed',
  };
}

/** Le dé seul, sans modificateur : ce que la fiche appelait déjà `unarmedDamage`. */
export function resolveUnarmedDamage(effects: readonly CollectedEffect[]): string {
  return unarmedReplacementOf(effects)?.dice ?? String(DEFAULT_UNARMED_DAMAGE);
}

/** Le dernier remplacement l'emporte, comme l'ordre de collecte des effets le veut. */
function unarmedReplacementOf(effects: readonly CollectedEffect[]): PassiveEffect | undefined {
  return effects
    .map((collected) => collected.effect.passive)
    .filter((passive): passive is PassiveEffect =>
      passive?.target === 'unarmedDamage' && Boolean(passive.dice))
    .at(-1);
}

function unarmedAbility(replacement: PassiveEffect | undefined, context: FormulaContext): Ability {
  const allowed = replacement?.formula?.kind === 'abilityModifier'
    ? replacement.formula.ability
    : 'strength';
  const { abilityModifiers } = context;

  return abilityModifiers[allowed] > abilityModifiers.strength ? allowed : 'strength';
}

/** Sans dé, les dégâts sont un nombre : « 1 + Force » se lit « 4 », pas « 1 + 3 ». */
function unarmedDamage(dice: string | undefined, modifier: number): string {
  if (!dice) return String(DEFAULT_UNARMED_DAMAGE + modifier);
  if (modifier === 0) return dice;
  return `${dice} ${modifier > 0 ? '+' : '-'} ${Math.abs(modifier)}`;
}
