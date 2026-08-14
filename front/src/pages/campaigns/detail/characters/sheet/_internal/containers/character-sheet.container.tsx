import { useParams } from "react-router-dom";
import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useDndCatalog } from "@/shared/queries/use-dnd-catalog";
import { toCampaignDetailCharacters } from "@/shared/constants/routes";
import { CharacterSheetView } from "@/shared/components/character/character-sheet.view";
import { FullWidthPageView } from "@/shared/components/layout/full-width-page.view";
import { useCharacterSheet } from "../queries/use-character-sheet";

export function CharacterSheetContainer() {
  const { campaignId = "", characterId = "" } = useParams();
  const { data: sheet, isError } = useCharacterSheet(campaignId, characterId);
  const { data: catalog } = useDndCatalog();
  const { data: campaign } = useCampaignDetail(campaignId);
  const name = useCharacterName(campaignId, characterId);

  if (isError) return <p className="empty-state-text">Cette fiche n'est pas disponible.</p>;
  if (!sheet || !catalog) return null;

  return (
    <FullWidthPageView
      title={name}
      subtitle={campaign?.name}
      backTo={toCampaignDetailCharacters(campaignId)}
      backLabel="Retour aux personnages"
    >
      <CharacterSheetView name={name} sheet={sheet} skillLabels={catalog.skillLabels} />
    </FullWidthPageView>
  );
}

/** La fiche calculée ne porte pas le nom : il vit sur l'agrégat, pas sur le résolu. */
function useCharacterName(campaignId: string, characterId: string): string {
  const { data: characters } = useCampaignCharacters(campaignId);

  return characters?.find((entry) => entry.id === characterId)?.name ?? "";
}
