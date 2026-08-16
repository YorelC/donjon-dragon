import { SKILL_CHOICE_ANY } from '@donjon-dragon/shared/dnd-catalog-schema';
import { SkillNameSchema } from '@donjon-dragon/shared/dnd-reference-schema';

import { CLASSES } from '../../back/src/modules/characters/domain/reference/classes';

import type { Comparator } from './compare.ts';
import { compareEntry } from './compare.ts';
import type { Divergence, DomainReport, Orphan } from './divergence.ts';
import type { SrdClass } from './srd-reference.ts';
import { readSrdClasses } from './srd-reference.ts';
import {
  toAbilities,
  toArmorTraining,
  toPrimaryAbilities,
  toSkillChoice,
  toWeaponProficiencies,
} from './to-reference.ts';

/**
 * Les 12 classes au niveau 1, projet contre SRD.
 *
 * Le SRD range armures, armes et jets de sauvegarde dans une seule liste
 * `proficiencies` non typée ; `to-reference.ts` la redécoupe avant de comparer.
 * L'équipement de départ n'est pas comparé ici : sa forme SRD est un arbre
 * d'options qui référence des catégories (« outils d'artisan ») et non des
 * objets, et l'apparier demande l'arbitrage documenté dans le plan.
 */

type ProjectClass = (typeof CLASSES)[keyof typeof CLASSES];

const DOMAIN = 'classes';

const COMPARATORS: Comparator<ProjectClass, SrdClass>[] = [
  { field: 'hitDie', ofProject: (c) => c.hitDie, ofSrd: (c) => c.hit_die },
  { field: 'primaryAbilities', ofProject: (c) => c.primaryAbilities, ofSrd: toPrimaryAbilities },
  { field: 'savingThrows', ofProject: (c) => c.savingThrows, ofSrd: (c) => toAbilities(c.saving_throws) },
  { field: 'armorTraining', ofProject: (c) => c.armorTraining, ofSrd: toArmorTraining },
  { field: 'weaponProficiencies', ofProject: (c) => c.weaponProficiencies, ofSrd: toWeaponProficiencies },
  { field: 'skillChoice.count', ofProject: (c) => c.skillChoice?.count, ofSrd: (c) => toSkillChoice(c)?.count },
  { field: 'skillChoice.options', ofProject: skillOptionsOf, ofSrd: (c) => toSkillChoice(c)?.options },
];

/**
 * Le barde choisit parmi toutes les compétences ; le projet l'écrit `'any'` et le
 * SRD énumère les dix-huit. C'est la même règle, pas une divergence.
 */
function skillOptionsOf(characterClass: ProjectClass): readonly string[] | undefined {
  const options = characterClass.skillChoice?.options;
  if (options === SKILL_CHOICE_ANY) return SkillNameSchema.options;
  return options;
}

export function auditClasses(): DomainReport {
  const project = Object.values(CLASSES);
  const srd = readSrdClasses();
  const srdByKey = new Map(srd.map((entry) => [entry.index, entry]));
  const matched = project.filter((characterClass) => srdByKey.has(characterClass.key));

  return {
    domain: DOMAIN,
    projectCount: project.length,
    srdCount: srd.length,
    matchedCount: matched.length,
    divergences: matched.flatMap((entry) => compare(entry, srdByKey.get(entry.key)!)),
    missingInSrd: project.filter((c) => !srdByKey.has(c.key)).map(toProjectOrphan),
    missingInProject: srd.filter((c) => !(c.index in CLASSES)).map(toSrdOrphan),
  };
}

function compare(characterClass: ProjectClass, srd: SrdClass): Divergence[] {
  return compareEntry(
    { domain: DOMAIN, key: characterClass.key },
    { project: characterClass, srd },
    COMPARATORS,
  );
}

function toProjectOrphan(characterClass: ProjectClass): Orphan {
  return { domain: DOMAIN, key: characterClass.key, name: characterClass.name, suggestion: null };
}

function toSrdOrphan(srd: SrdClass): Orphan {
  return { domain: DOMAIN, key: srd.index, name: srd.name, suggestion: null };
}
