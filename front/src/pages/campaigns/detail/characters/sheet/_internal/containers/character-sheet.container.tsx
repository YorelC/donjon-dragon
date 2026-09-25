import { useParams } from "react-router-dom";
import { useCharacterSheetPage } from "../hooks/use-character-sheet-page";
import { CharacterSheetPageView } from "../views/character-sheet-page.view";

export function CharacterSheetContainer() {
  const { campaignId = "", characterId = "" } = useParams();
  const page = useCharacterSheetPage(campaignId, characterId);

  return <CharacterSheetPageView page={page} campaignId={campaignId} />;
}
