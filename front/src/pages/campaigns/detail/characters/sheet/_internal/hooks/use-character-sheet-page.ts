import { useDndCatalog } from "@/shared/queries/use-dnd-catalog";
import type { QueryState } from "@/shared/types/ui-state";
import { useCharacterIdentity } from "../queries/use-character-identity";
import { useCharacterSheet } from "../queries/use-character-sheet";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { toSheetModel } from "../utils/sheet-model";

export function useCharacterSheetPage(
  campaignId: string,
  characterId: string,
): QueryState<CharacterSheetModel | null> {
  const sheet = useCharacterSheet(campaignId, characterId);
  const identity = useCharacterIdentity(campaignId, characterId);
  const catalog = useDndCatalog();

  return {
    data: toSheetModel({ sheet: sheet.data, build: identity.data, catalog: catalog.data }),
    loading: sheet.isLoading || identity.isLoading || catalog.isLoading,
    error: sheet.isError || identity.isError || catalog.isError,
  };
}
