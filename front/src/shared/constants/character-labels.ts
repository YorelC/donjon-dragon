import type { ArmorTraining, CreatureSize, WeaponProficiency } from "@donjon-dragon/shared";

/** Libellés partagés par la fiche et le créateur : une seule table par énumération. */
export const SIZE_LABELS: Record<CreatureSize, string> = { Small: "P", Medium: "M" };

export const ARMOR_TRAINING_LABELS: Record<ArmorTraining, string> = {
  light: "légères",
  medium: "intermédiaires",
  heavy: "lourdes",
  shields: "boucliers",
};

export const WEAPON_PROFICIENCY_LABELS: Record<WeaponProficiency, string> = {
  simple: "simples",
  martial: "de guerre",
  martialFinesseOrLight: "de guerre finesse ou légères",
  martialLight: "de guerre légères",
};
