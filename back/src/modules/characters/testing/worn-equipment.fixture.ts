import { ARMORS, SHIELD } from '../domain/reference/armors';
import { SHIELD_ITEM_KEY, type CharacterEquipment } from '../domain/character-equipment';
import type { CharacterBuild } from '../domain/resolution/character-build';
import { resolveSheet, type ComputedCharacter } from '../domain/resolution/resolve-sheet';
import type { WornArmor, WornEquipment } from '../domain/resolution/worn-equipment';

/**
 * En production, les statistiques de ce qui est porté viennent de la collection
 * d'objets, résolues par la couche application. Les tests du moteur les prennent
 * dans les constantes de référence — qui sont aussi la source du seed, donc les
 * mêmes chiffres qu'en base.
 */
export function wornFrom(equipment: CharacterEquipment): WornEquipment {
  return {
    armor: equipment.armorKey ? armorFrom(equipment.armorKey) : null,
    shield: equipment.shield ? shieldStats() : null,
  };
}

/** Le moteur, monté comme la couche application le monte. */
export function resolveSheetOf(build: CharacterBuild): ComputedCharacter {
  return resolveSheet(build, wornFrom(build.equipment));
}

function armorFrom(key: string): WornArmor | null {
  if (key === SHIELD_ITEM_KEY) return shieldStats();
  const armor = ARMORS[key];
  if (!armor) return null;

  return {
    name: armor.name,
    baseArmorClass: armor.baseArmorClass,
    dexterityAllowance: armor.dexterityAllowance,
    stealthDisadvantage: armor.stealthDisadvantage,
  };
}

function shieldStats(): WornArmor {
  return {
    name: SHIELD.name,
    baseArmorClass: SHIELD.armorClassBonus,
    dexterityAllowance: 'none',
    stealthDisadvantage: false,
  };
}
