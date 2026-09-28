import { useParams } from "react-router-dom";
import { useBuilderScreen } from "../hooks/use-builder-screen";
import { CharacterBuilderView } from "../views/character-builder.view";

export function CharacterBuilderContainer() {
  const { campaignId = "", characterId } = useParams();
  const screen = useBuilderScreen({ campaignId, characterId: characterId ?? null });
  if (!screen) return null;

  return <CharacterBuilderView screen={screen} />;
}
