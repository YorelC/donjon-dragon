import { useParams } from "react-router-dom";
import { useCampaignCharacters } from "@/shared/queries/use-campaign-characters";
import { useDndCatalog } from "@/shared/queries/use-dnd-catalog";
import { CharacterSheetView } from "@/shared/components/character/character-sheet.view";
import { useCharacterSheet } from "../queries/use-character-sheet";

export function CharacterSheetContainer() {
  const { campaignId = "", characterId = "" } = useParams();
  const { data: sheet, isError } = useCharacterSheet(campaignId, characterId);
  const { data: catalog } = useDndCatalog();
  const { data: characters } = useCampaignCharacters(campaignId);
  const character = characters?.find((entry) => entry.id === characterId);

  if (isError) return <p className="empty-state-text">Cette fiche n'est pas disponible.</p>;
  if (!sheet || !catalog) return null;

  return (
    <CharacterSheetView
      name={character?.name ?? ""}
      sheet={sheet}
      skillLabels={catalog.skillLabels}
    />
  );
}
