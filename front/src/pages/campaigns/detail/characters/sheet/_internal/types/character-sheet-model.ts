import type {
  CharacterBuildDetailDto,
  ComputedCharacter,
  SkillName,
} from "@donjon-dragon/shared";

export type CharacterIdentity = Pick<
  CharacterBuildDetailDto,
  "name" | "alignment" | "age" | "heightCm" | "weightKg" | "description"
>;

/** Les libellés que le catalogue résout pour ce personnage-là. */
export interface SheetLabels {
  skills: Partial<Record<SkillName, string>>;
  tools: Record<string, string>;
  /** Clés de langue en chaîne : `proficiencies.languages` n'est pas typé plus finement. */
  languages: Partial<Record<string, string>>;
  alignment: string;
  backgroundDescription: string | null;
}

/** Tout ce que la fiche affiche, déjà réuni : les trois lectures n'ont de sens qu'ensemble. */
export interface CharacterSheetModel {
  sheet: ComputedCharacter;
  identity: CharacterIdentity;
  labels: SheetLabels;
}
