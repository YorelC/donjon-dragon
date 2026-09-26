import {
  ALL_CONCRETE_TOOLS,
  ARTISAN_TOOLS,
  BACKGROUND_TOOL_CHOICES,
  MUSICAL_INSTRUMENTS,
} from '../reference/creation-options';
import { CLASSES } from '../reference/classes';
import type { BackgroundKey, ClassKey, OriginFeatKey } from '../reference/keys';
import { WEAPONS, type Weapon } from '../reference/weapons';

/**
 * Ce qu'une classe et un historique laissent choisir, et rien d'autre.
 *
 * Ces bornes servent DEUX lecteurs : la validation, qui refuse ce qui en sort,
 * et le catalogue, qui dit au wizard quoi proposer. Les laisser diverger, c'est
 * offrir au joueur des options que le serveur rejettera — et `classes.ts`
 * annonce déjà « n'importe quel outil » là où le barde n'a droit qu'aux
 * instruments. Une seule source, donc, et elle est ici.
 */
export function weaponMasteryCount(classKey: ClassKey): number {
  return CLASSES[classKey].level1Features
    .flatMap((feature) => feature.effects)
    .reduce((count, effect) => count + (effect.grants?.weaponMasteryCount ?? 0), 0);
}

/** Les armes dont la classe a la maîtrise : ce sont les seules à pouvoir l'être. */
export function weaponMasteryOptions(classKey: ClassKey): readonly string[] {
  return Object.values(WEAPONS)
    .filter((weapon) => weaponIsProficient(classKey, weapon))
    .map((weapon) => weapon.key);
}

function weaponIsProficient(classKey: ClassKey, weapon: Weapon): boolean {
  const proficiencies = CLASSES[classKey].weaponProficiencies;

  return (
    proficiencies.includes(weapon.category) ||
    (proficiencies.includes('martialFinesseOrLight') && hasFinesseOrLight(weapon))
  );
}

function hasFinesseOrLight(weapon: Weapon): boolean {
  const eligible = weapon.properties.some(
    (property) => property === 'finesse' || property === 'light',
  );

  return weapon.category === 'martial' && eligible;
}

/**
 * Le barde n'apprend que des instruments, le moine des outils d'artisan ou des
 * instruments. Les autres classes ne choisissent pas d'outil, mais la liste
 * complète reste la borne par défaut.
 */
export function classToolOptions(classKey: ClassKey): readonly string[] {
  if (classKey === 'bard') return MUSICAL_INSTRUMENTS;
  if (classKey === 'monk') return [...ARTISAN_TOOLS, ...MUSICAL_INSTRUMENTS];

  return ALL_CONCRETE_TOOLS;
}

/**
 * Les outils qu'un don d'Origine fait choisir (B01-ORI-006). Doué les mêle aux
 * compétences : ce ne sont que ses options d'outils.
 */
const FEAT_TOOL_OPTIONS: Partial<Record<OriginFeatKey, readonly string[]>> = {
  crafter: ARTISAN_TOOLS,
  musician: MUSICAL_INSTRUMENTS,
  skilled: ALL_CONCRETE_TOOLS,
};

export function featToolOptions(feat: OriginFeatKey): readonly string[] {
  return FEAT_TOOL_OPTIONS[feat] ?? [];
}

/** Cinq historiques laissent choisir leur outil ; les onze autres l'imposent. */
export function backgroundToolOptions(key: BackgroundKey): readonly string[] {
  return BACKGROUND_TOOL_CHOICES[key] ?? [];
}
