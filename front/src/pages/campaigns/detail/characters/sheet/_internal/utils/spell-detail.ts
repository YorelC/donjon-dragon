import type { ResolvedSpellDetail } from "@donjon-dragon/shared";
import { SPELL_SCHOOL_LABELS } from "../constants/sheet-labels";
import { toLabel } from "./sheet-format";

export interface SpellFact {
  label: string;
  value: string;
  /** Une composante matérielle se décrit en phrase : elle prend toute la ligne. */
  wide: boolean;
}

const CANTRIP_LEVEL = 0;
const RITUAL_LABEL = "Rituel";

/** « Sort mineur · Évocation », « Sort de niveau 1 · Abjuration · Rituel ». */
export function toSpellKicker(detail: ResolvedSpellDetail): string {
  const level = detail.level === CANTRIP_LEVEL ? "Sort mineur" : `Sort de niveau ${detail.level}`;
  const parts = [level, toLabel(SPELL_SCHOOL_LABELS, detail.school)];

  return (detail.ritual ? [...parts, RITUAL_LABEL] : parts).join(" · ");
}

/** Ce qu'il faut savoir avant de lancer : une case par contrainte. */
export function toSpellFacts(detail: ResolvedSpellDetail): SpellFact[] {
  const facts = [
    fact("Incantation", detail.castingTime),
    fact("Portée", detail.range),
    fact("Durée", toDuration(detail)),
    fact("Composantes", toComponents(detail.components)),
  ];
  const material = detail.components.material;

  return material ? [...facts, { label: "Matériel", value: material, wide: true }] : facts;
}

function fact(label: string, value: string): SpellFact {
  return { label, value, wide: false };
}

function toDuration({ concentration, duration }: ResolvedSpellDetail): string {
  return concentration ? `Concentration, ${duration}` : duration;
}

function toComponents({ verbal, somatic, material }: ResolvedSpellDetail["components"]): string {
  const letters = [verbal && "V", somatic && "S", material !== null && "M"];
  return letters.filter((letter): letter is string => typeof letter === "string").join(", ");
}
