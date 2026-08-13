import type { CharacterChoices } from '../character-choices';
import type { Ability } from '../reference/abilities';
import type { CollectedEffect, GrantPayload } from '../reference/effect';
import {
  DEFAULT_LANGUAGE,
  type ArmorTraining,
  type Language,
  type WeaponProficiency,
} from '../reference/proficiencies';
import type { SkillName } from '../reference/skills';

export interface ResolvedProficiencies {
  skills: SkillName[];
  expertise: SkillName[];
  tools: string[];
  languages: Language[];
  armorTraining: ArmorTraining[];
  weapons: WeaponProficiency[];
  savingThrows: Ability[];
}

/**
 * Ce que le personnage maîtrise, une fois réunis les octrois déterministes et
 * les choix du joueur.
 *
 * Le dédoublonnage n'est pas cosmétique : un roublard haut-elfe avec le don Doué
 * peut se voir proposer Perception par quatre sources, et sa fiche ne doit
 * l'afficher qu'une fois — un bonus de maîtrise ne se compte jamais deux fois.
 */
export function resolveProficiencies(
  effects: readonly CollectedEffect[],
  choices: CharacterChoices,
  savingThrows: readonly Ability[],
): ResolvedProficiencies {
  const granted = effects.flatMap((collected) =>
    collected.effect.grants ? [collected.effect.grants] : [],
  );

  return {
    skills: skillsOf(granted, choices),
    expertise: unique(choices.all.flatMap((choice) => choice.expertise ?? [])),
    tools: toolsOf(granted, choices),
    languages: languagesOf(granted, choices),
    armorTraining: unique(granted.flatMap(pick((grant) => grant.armorTraining))),
    weapons: unique(granted.flatMap(pick((grant) => grant.weaponProficiencies))),
    savingThrows: [...savingThrows],
  };
}

function skillsOf(granted: readonly GrantPayload[], choices: CharacterChoices): SkillName[] {
  return unique([
    ...granted.flatMap(pick((grant) => grant.skillProficiencies)),
    ...choices.all.flatMap((choice) => choice.skills ?? []),
  ]);
}

function toolsOf(granted: readonly GrantPayload[], choices: CharacterChoices): string[] {
  return unique([
    ...granted.flatMap(pick((grant) => grant.toolProficiencies)),
    ...choices.all.flatMap((choice) => choice.tools ?? []),
  ]);
}

function languagesOf(
  granted: readonly GrantPayload[],
  choices: CharacterChoices,
): Language[] {
  return unique<Language>([
    DEFAULT_LANGUAGE,
    ...granted.flatMap(pick((grant) => grant.languages)),
    ...choices.all.flatMap((choice) => choice.languages ?? []),
  ]);
}

/** Lit une liste d'un octroi, en traitant l'absence comme une liste vide. */
function pick<T>(
  read: (grant: GrantPayload) => readonly T[] | undefined,
): (grant: GrantPayload) => T[] {
  return (grant) => [...(read(grant) ?? [])];
}

function unique<T>(values: readonly T[]): T[] {
  return [...new Set(values)];
}
