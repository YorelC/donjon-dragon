import type { Ability, DndCatalog, SkillName } from "@donjon-dragon/shared";

const NO_SKILL = "aucune";

/** Ce que l'infobulle d'une caractéristique explique : ce qu'elle mesure, ce qu'elle gouverne. */
export interface AbilityHint {
  name: string;
  description: string;
  skills: string;
}

export type AbilityHints = Partial<Record<Ability, AbilityHint>>;

/** Les infobulles des six caractéristiques, tirées du catalogue. */
export function abilityHintsOf(catalog: DndCatalog): AbilityHints {
  return Object.fromEntries(catalog.abilities.map((ability) => [ability.key, {
    name: ability.name,
    description: ability.description,
    skills: skillNamesOf(catalog, ability.key) || NO_SKILL,
  }]));
}

/** Le nom de la caractéristique de chaque compétence : « Perception → Sagesse ». */
export function skillAbilityNamesOf(catalog: DndCatalog): Partial<Record<SkillName, string>> {
  const names = new Map(catalog.abilities.map((ability) => [ability.key, ability.name]));

  return Object.fromEntries(catalog.skills.map((skill) => [skill.key, names.get(skill.ability) ?? ""]));
}

function skillNamesOf(catalog: DndCatalog, ability: Ability): string {
  return catalog.skills
    .filter((skill) => skill.ability === ability)
    .map((skill) => skill.name)
    .join(", ");
}
