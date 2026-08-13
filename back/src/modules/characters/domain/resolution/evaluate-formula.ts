import type { Ability } from '../reference/abilities';
import type { Formula } from '../reference/effect';

export interface FormulaContext {
  level: number;
  proficiencyBonus: number;
  abilityModifiers: Record<Ability, number>;
}

type FormulaEvaluators = {
  [K in Formula['kind']]: (
    formula: Extract<Formula, { kind: K }>,
    context: FormulaContext,
  ) => number;
};

const EVALUATORS: FormulaEvaluators = {
  constant: (formula) => formula.value,
  abilityModifier: (formula, context) => context.abilityModifiers[formula.ability],
  proficiencyBonus: (_formula, context) => context.proficiencyBonus,
  perLevel: (formula, context) => formula.value * context.level,
  sum: (formula, context) =>
    formula.parts.reduce((total, part) => total + evaluateFormula(part, context), 0),
};

/**
 * Le `as never` compense une limite de TypeScript : il ne corrèle pas la clé lue
 * et la branche indexée. La table ci-dessus est, elle, vérifiée branche par
 * branche — ajouter une variante de `Formula` sans son évaluateur casse `tsc`.
 */
export function evaluateFormula(formula: Formula, context: FormulaContext): number {
  return EVALUATORS[formula.kind](formula as never, context);
}
