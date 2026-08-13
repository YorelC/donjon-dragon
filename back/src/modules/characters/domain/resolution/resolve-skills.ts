import type { Ability } from '../reference/abilities';
import {
  PASSIVE_SCORE_BASE,
  SKILLS,
  SKILL_ABILITY,
  type SkillName,
} from '../reference/skills';
import type { ResolvedProficiencies } from './resolve-proficiencies';

export interface ResolvedSkill {
  skill: SkillName;
  ability: Ability;
  modifier: number;
  proficient: boolean;
  expert: boolean;
}

export interface SkillsInput {
  abilityModifiers: Record<Ability, number>;
  proficiencyBonus: number;
  proficiencies: ResolvedProficiencies;
}

/**
 * Les 18 compétences, toujours toutes les 18 : une fiche affiche aussi celles
 * que le personnage ne maîtrise pas, avec leur simple modificateur.
 */
export function resolveSkills(input: SkillsInput): ResolvedSkill[] {
  return SKILLS.map((skill) => resolveSkill(skill, input));
}

function resolveSkill(skill: SkillName, input: SkillsInput): ResolvedSkill {
  const ability = SKILL_ABILITY[skill];
  const proficient = input.proficiencies.skills.includes(skill);
  const expert = input.proficiencies.expertise.includes(skill);

  return {
    skill,
    ability,
    modifier:
      input.abilityModifiers[ability] +
      proficiencyShare({ proficient, expert, bonus: input.proficiencyBonus }),
    proficient,
    expert,
  };
}

/** L'expertise double le bonus de maîtrise ; elle ne l'accorde pas. */
function proficiencyShare(params: {
  proficient: boolean;
  expert: boolean;
  bonus: number;
}): number {
  if (!params.proficient) return 0;
  return params.expert ? params.bonus * 2 : params.bonus;
}

export function passivePerceptionOf(skills: readonly ResolvedSkill[]): number {
  const perception = skills.find((skill) => skill.skill === 'perception');
  return PASSIVE_SCORE_BASE + (perception?.modifier ?? 0);
}

export interface ResolvedSavingThrow {
  ability: Ability;
  modifier: number;
  proficient: boolean;
}

export function resolveSavingThrows(input: SkillsInput): Record<Ability, ResolvedSavingThrow> {
  const entries = Object.entries(input.abilityModifiers) as [Ability, number][];

  return Object.fromEntries(
    entries.map(([ability, modifier]) => {
      const proficient = input.proficiencies.savingThrows.includes(ability);
      const bonus = proficient ? input.proficiencyBonus : 0;
      return [ability, { ability, modifier: modifier + bonus, proficient }];
    }),
  ) as Record<Ability, ResolvedSavingThrow>;
}
