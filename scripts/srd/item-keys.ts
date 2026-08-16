import type { Item } from '@donjon-dragon/shared/item-schema';

import type { SrdEquipment } from './srd-equipment.ts';
import { toCopper, toKilograms } from './units.ts';

/**
 * L'appariement entre les clés du projet et celles du SRD.
 *
 * Le catalogue actuel parle deux langues : les armes et les armures portent une
 * clé anglaise (`battleaxe`, `breastplate`), le reste un slug français (`acide`,
 * `sac-dos`). C'est l'héritage du pipeline AideDD, et c'est précisément ce que
 * cet audit doit rendre visible avant qu'on le corrige.
 */

/** Le SRD suffixe les armures, pas le projet : `plate-armor` ici, `plate` là-bas. */
const ARMOR_SUFFIX = '-armor';

export function normalizeSrdKey(index: string): string {
  return index.endsWith(ARMOR_SUFFIX) ? index.slice(0, -ARMOR_SUFFIX.length) : index;
}

/**
 * Les slugs français déjà tranchés. La table est volontairement vide au départ :
 * chaque ligne qu'on y ajoute est un arbitrage humain, pas une devinette de
 * script. Les candidats proposés par l'audit servent à la remplir.
 */
export const FRENCH_KEY_ALIASES: Record<string, string> = {};

export function findSrdMatch(item: Item, srdByKey: Map<string, SrdEquipment>): SrdEquipment | null {
  const aliased = FRENCH_KEY_ALIASES[item.key];
  return srdByKey.get(aliased ?? item.key) ?? null;
}

export function indexSrdByNormalizedKey(equipment: SrdEquipment[]): Map<string, SrdEquipment> {
  return new Map(equipment.map((entry) => [normalizeSrdKey(entry.index), entry]));
}

/**
 * Faute de clé commune, on compare l'empreinte : un objet du manuel a un prix et
 * un poids, et les deux ensemble sont rarement ambigus. Un seul candidat vaut
 * une proposition ; plusieurs valent un silence, parce qu'une proposition fausse
 * coûte plus cher à relire qu'une case vide.
 */
export function suggestByFingerprint(item: Item, candidates: SrdEquipment[]): SrdEquipment | null {
  const matches = candidates.filter((candidate) => hasSameFingerprint(item, candidate));
  return matches.length === 1 ? matches[0] : null;
}

function hasSameFingerprint(item: Item, candidate: SrdEquipment): boolean {
  return (
    item.costInCopper === toCopper(candidate.cost) &&
    item.weightInKg === toKilograms(candidate.weight)
  );
}
