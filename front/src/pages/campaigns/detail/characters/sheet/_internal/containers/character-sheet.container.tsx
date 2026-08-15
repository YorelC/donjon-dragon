import { useParams } from "react-router-dom";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useDndCatalog } from "@/shared/queries/use-dnd-catalog";
import { useCharacterName } from "../hooks/use-character-name";
import { useCharacterSheet } from "../queries/use-character-sheet";
import { CharacterSheetPageView } from "../views/character-sheet-page.view";

export function CharacterSheetContainer() {
  const { campaignId = "", characterId = "" } = useParams();
  const sheetQuery = useCharacterSheet(campaignId, characterId);
  const { data: catalog } = useDndCatalog();
  const { data: campaign } = useCampaignDetail(campaignId);
  const name = useCharacterName(campaignId, characterId);

  return (
    <CharacterSheetPageView
      sheet={{
        data: sheetQuery.data ?? null,
        loading: sheetQuery.isLoading,
        error: sheetQuery.isError,
      }}
      character={{ name, campaignId, campaignName: campaign?.name }}
      skillLabels={catalog?.skillLabels ?? null}
    />
  );
}
