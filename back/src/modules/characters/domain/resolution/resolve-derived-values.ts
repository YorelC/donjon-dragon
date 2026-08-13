import { CLASSES } from '../reference/classes';
import type { CollectedEffect, EffectTarget, PassiveEffect } from '../reference/effect';
import { SPECIES } from '../reference/species';
import type { CharacterBuild } from './character-build';
import { evaluateFormula, type FormulaContext } from './evaluate-formula';
import type { ResolvedValue } from './resolve-armor-class';

export interface DerivedInput {
  build: CharacterBuild;
  effects: readonly CollectedEffect[];
  context: FormulaContext;
}

/**
 * Les points de vie du niveau 1 : le maximum du dé de vie, jamais un jet, plus
 * le modificateur de Constitution. Les bonus passifs — Robuste, Ténacité naine —
 * s'ajoutent par-dessus.
 */
export function resolveMaxHitPoints(input: DerivedInput): ResolvedValue {
  const characterClass = CLASSES[input.build.classKey];
  const base = characterClass.hitDie + input.context.abilityModifiers.constitution;
  const bonus = sumBonuses(input, 'maxHp');

  return {
    value: base + bonus.value,
    sources: [`Dé de vie d${characterClass.hitDie}`, ...bonus.sources],
  };
}

export function resolveInitiative(input: DerivedInput): ResolvedValue {
  const bonus = sumBonuses(input, 'initiative');

  return {
    value: input.context.abilityModifiers.dexterity + bonus.value,
    sources: ['Dextérité', ...bonus.sources],
  };
}

/**
 * La vitesse est la seule valeur où un `set` d'espèce l'emporte sur la base :
 * l'elfe des bois passe à 10,50 m, il n'ajoute pas 1,50 m.
 */
export function resolveSpeed(input: DerivedInput): ResolvedValue {
  const species = SPECIES[input.build.speciesKey];
  const replacement = lastSet(input, 'speed');
  const bonus = sumBonuses(input, 'speed');
  const base = replacement ?? { value: species.speed, source: species.name };

  return { value: base.value + bonus.value, sources: [base.source, ...bonus.sources] };
}

interface Contribution {
  value: number;
  source: string;
}

function sumBonuses(input: DerivedInput, target: EffectTarget): ResolvedValue {
  const bonuses = contributions(input, target, 'bonus');

  return {
    value: bonuses.reduce((total, bonus) => total + bonus.value, 0),
    sources: bonuses.map((bonus) => bonus.source),
  };
}

function lastSet(input: DerivedInput, target: EffectTarget): Contribution | null {
  const replacements = contributions(input, target, 'set');
  return replacements.at(-1) ?? null;
}

function contributions(
  input: DerivedInput,
  target: EffectTarget,
  kind: PassiveEffect['kind'],
): Contribution[] {
  return input.effects.flatMap((collected) => {
    const passive = collected.effect.passive;
    if (passive?.kind !== kind || passive.target !== target || !passive.formula) return [];

    return [
      { value: evaluateFormula(passive.formula, input.context), source: collected.feature },
    ];
  });
}
