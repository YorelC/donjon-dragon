import { FREE_CAST_LABELS, SPELL_STATUS, type CastableSpell } from "../constants/sheet-labels";

/** Ce qui rend ce sort particulier, sinon son statut par défaut dans sa liste. */
export function toSpellStatus(spell: CastableSpell, fallback: string): string {
  if (spell.freeCastFrequency) return FREE_CAST_LABELS[spell.freeCastFrequency];
  if (spell.ritualOnly) return SPELL_STATUS.ritualOnly;
  if (spell.alwaysPrepared) return SPELL_STATUS.alwaysPrepared;
  return fallback;
}
