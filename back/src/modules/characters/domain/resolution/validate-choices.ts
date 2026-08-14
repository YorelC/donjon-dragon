import { InvalidDomainError } from '@kernel/domain/domain.error';

import type { CharacterChoices } from '../character-choices';
import { CLASSES } from '../reference/classes';
import type { SkillChoice } from '../reference/effect';
import type { ClassKey, LineageKey, SpeciesKey } from '../reference/keys';
import { SKILLS, type SkillName } from '../reference/skills';
import { SPECIES } from '../reference/species';

export class LineageRequiredError extends InvalidDomainError {
  constructor() {
    super('This species requires a lineage');
  }
}

export class UnknownLineageError extends InvalidDomainError {
  constructor() {
    super('Unknown lineage for this species');
  }
}

export class InvalidSkillChoiceError extends InvalidDomainError {
  constructor(readonly origin: string) {
    super(`Invalid skill choice for ${origin}`);
  }
}

export interface ChoicesToValidate {
  speciesKey: SpeciesKey;
  lineageKey: LineageKey | null;
  classKey: ClassKey;
  choices: CharacterChoices;
}

/**
 * Ce que le joueur devait choisir, et ce qu'il a effectivement choisi.
 *
 * La validation s'arrête ici aux choix qui changent visiblement la fiche : le
 * lignage, et les compétences de classe et d'espèce. Les outils, les langues et
 * les sorts restent libres pour l'instant — le moteur les accepte tels quels et
 * les affiche ; les verrouiller demandera de décrire les listes d'outils, qui
 * n'existent pas encore en données de référence.
 */
export function validateChoices(input: ChoicesToValidate): void {
  assertLineageIsValid(input);
  assertClassSkills(input);
  assertSpeciesSkills(input);
}

function assertLineageIsValid(input: ChoicesToValidate): void {
  const lineage = SPECIES[input.speciesKey].lineage;
  if (!lineage) return;
  if (input.lineageKey === null) throw new LineageRequiredError();

  const known = lineage.options.some((option) => option.key === input.lineageKey);
  if (!known) throw new UnknownLineageError();
}

function assertClassSkills(input: ChoicesToValidate): void {
  const characterClass = CLASSES[input.classKey];
  assertSkillChoice({
    expected: characterClass.skillChoice,
    chosen: skillsFrom(input, 'class', characterClass.key),
    origin: characterClass.name,
  });
}

/**
 * Les Sens aiguisés de l'elfe et le Compétent de l'humain sont le seul choix de
 * compétence porté par une espèce au niveau 1. Une espèce qui n'en offre pas ne
 * doit rien laisser choisir.
 */
function assertSpeciesSkills(input: ChoicesToValidate): void {
  const species = SPECIES[input.speciesKey];
  const expected = speciesSkillChoice(input.speciesKey);
  assertSkillChoice({
    expected,
    chosen: skillsFrom(input, 'species', species.key),
    origin: species.name,
  });
}

const NO_SKILL_CHOICE: SkillChoice = { count: 0, options: [] };

function speciesSkillChoice(speciesKey: SpeciesKey): SkillChoice {
  const fromTraits = SPECIES[speciesKey].traits
    .flatMap((trait) => trait.effects)
    .flatMap((effect) => (effect.grants?.skillChoice ? [effect.grants.skillChoice] : []));

  return fromTraits[0] ?? NO_SKILL_CHOICE;
}

interface SkillChoiceCheck {
  expected: SkillChoice;
  chosen: readonly SkillName[];
  origin: string;
}

function assertSkillChoice(check: SkillChoiceCheck): void {
  if (check.chosen.length !== check.expected.count) {
    throw new InvalidSkillChoiceError(check.origin);
  }
  const allowed = check.expected.options === 'any' ? SKILLS : check.expected.options;
  if (!check.chosen.every((skill) => allowed.includes(skill))) {
    throw new InvalidSkillChoiceError(check.origin);
  }
}

function skillsFrom(
  input: ChoicesToValidate,
  type: 'class' | 'species',
  key: string,
): SkillName[] {
  return input.choices.from({ type, key }).flatMap((choice) => choice.skills ?? []);
}
