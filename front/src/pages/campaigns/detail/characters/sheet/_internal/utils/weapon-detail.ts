import type { ResolvedAttack } from "@donjon-dragon/shared";
import {
  ABILITY_LABELS,
  DAMAGE_TYPE_LABELS,
  PACT_OF_THE_BLADE_LABEL,
} from "../constants/sheet-labels";
import type { SheetDetail } from "../types/sheet-detail";
import { formatSigned, toLabel } from "./sheet-format";

const MELEE_LABEL = "Corps à corps";
const MASTERY_LABEL = "Botte d'arme";
const UNTRAINED_LABEL = "Non maîtrisée";
const TRAINED_LABEL = "Maîtrisée";

export function attackKey(attack: ResolvedAttack): string {
  return `${attack.weaponKey}:${attack.source ?? "equipment"}`;
}

export function toDamageLabel(attack: ResolvedAttack): string {
  return `${attack.damage} ${toLabel<string>(DAMAGE_TYPE_LABELS, attack.damageType)}`;
}

/** La ligne sous le nom : ce qui distingue cette attaque d'une autre. */
export function toAttackNote(attack: ResolvedAttack): string {
  return [
    toRangeLabel(attack),
    attack.mastery ? MASTERY_LABEL : null,
    attack.source ? PACT_OF_THE_BLADE_LABEL : null,
    attack.proficient ? null : UNTRAINED_LABEL,
  ].filter((part): part is string => part !== null).join(" · ");
}

export function toWeaponDetail(attack: ResolvedAttack): SheetDetail {
  return {
    name: attack.name,
    meta: `${ABILITY_LABELS[attack.ability]} · ${attack.proficient ? TRAINED_LABEL : UNTRAINED_LABEL}`,
    lines: [
      `Portée : ${toRangeLabel(attack)}`,
      `Bonus d'attaque : ${formatSigned(attack.attackBonus)}`,
      `Dégâts : ${toDamageLabel(attack)}`,
      ...(attack.mastery ? [`${MASTERY_LABEL} débloquée pour cette arme.`] : []),
    ],
  };
}

function toRangeLabel(attack: ResolvedAttack): string {
  if (!attack.range) return MELEE_LABEL;
  return `${attack.range.normal} / ${attack.range.max} m`;
}
