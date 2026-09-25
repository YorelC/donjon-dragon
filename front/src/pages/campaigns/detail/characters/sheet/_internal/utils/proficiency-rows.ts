import type { ComputedCharacter } from "@donjon-dragon/shared";
import {
  ABILITY_LABELS,
  ARMOR_TRAINING_LABELS,
  WEAPON_PROFICIENCY_LABELS,
} from "../constants/sheet-labels";
import type { SheetLabels } from "../types/character-sheet-model";
import { formatMeters, toLabelList } from "./sheet-format";

export interface ProficiencyRow {
  name: string;
  value: string;
}

const NONE = "Aucune";

/** Les maîtrises en clair, ligne par ligne ; une liste vide se dit, elle ne disparaît pas. */
export function toProficiencyRows(sheet: ComputedCharacter, labels: SheetLabels): ProficiencyRow[] {
  const { proficiencies } = sheet;

  return [
    { name: "Armes", value: orNone(toLabelList(WEAPON_PROFICIENCY_LABELS, proficiencies.weapons)) },
    { name: "Armures", value: orNone(toLabelList(ARMOR_TRAINING_LABELS, proficiencies.armorTraining)) },
    { name: "Jets de sauvegarde", value: orNone(toLabelList(ABILITY_LABELS, proficiencies.savingThrows)) },
    { name: "Compétences", value: orNone(toLabelList(labels.skills, proficiencies.skills)) },
    { name: "Outils", value: orNone(toLabelList(labels.tools, proficiencies.tools)) },
    { name: "Langues", value: orNone(toLabelList(labels.languages, proficiencies.languages)) },
  ];
}

/** Les sens que la fiche calcule : ils n'ont pas leur place dans le panneau d'identité. */
export function toSenseRows(sheet: ComputedCharacter): ProficiencyRow[] {
  const passive = { name: "Perception passive", value: String(sheet.passivePerception) };
  if (sheet.darkvision === 0) return [passive];

  return [passive, { name: "Vision dans le noir", value: formatMeters(sheet.darkvision) }];
}

function orNone(value: string): string {
  return value.length > 0 ? value : NONE;
}
