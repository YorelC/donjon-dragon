import type {
  CharacterBuildDetailDto,
  ComputedCharacter,
  DndCatalog,
} from "@donjon-dragon/shared";
import { GRANTED_LANGUAGE_LABELS } from "../constants/sheet-labels";
import type { CharacterSheetModel, SheetLabels } from "../types/character-sheet-model";

interface SheetSources {
  sheet: ComputedCharacter | undefined;
  build: CharacterBuildDetailDto | undefined;
  catalog: DndCatalog | undefined;
}

/** La fiche ne s'affiche qu'entière : tant qu'une des trois lectures manque, rien. */
export function toSheetModel({ sheet, build, catalog }: SheetSources): CharacterSheetModel | null {
  if (!sheet || !build || !catalog) return null;

  return {
    sheet,
    identity: build,
    labels: toSheetLabels(catalog, build),
  };
}

function toSheetLabels(catalog: DndCatalog, build: CharacterBuildDetailDto): SheetLabels {
  return {
    skills: catalog.skillLabels,
    tools: catalog.toolLabels,
    languages: toLanguageLabels(catalog),
    alignment: catalog.alignments.find((entry) => entry.key === build.alignment)?.name
      ?? build.alignment,
    backgroundDescription: catalog.backgrounds.find(
      (entry) => entry.key === build.backgroundKey,
    )?.description ?? null,
  };
}

function toLanguageLabels(catalog: DndCatalog): Partial<Record<string, string>> {
  const listed = [...catalog.languages.standard, ...catalog.languages.rare];

  return {
    ...GRANTED_LANGUAGE_LABELS,
    ...Object.fromEntries(listed.map((language) => [language.key, language.name])),
  };
}
