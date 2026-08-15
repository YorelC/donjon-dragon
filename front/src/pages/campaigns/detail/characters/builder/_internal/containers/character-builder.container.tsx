import { useParams } from "react-router-dom";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { toCampaignDetailCharacters } from "@/shared/constants/routes";
import { FullWidthPageView } from "@/shared/components/layout/full-width-page.view";
import { useBuilderScreen } from "../hooks/use-builder-screen";
import { CharacterBuilderView } from "../views/character-builder.view";

export function CharacterBuilderContainer() {
  const { campaignId = "", characterId } = useParams();
  const { data: campaign } = useCampaignDetail(campaignId);
  const screen = useBuilderScreen({ campaignId, characterId: characterId ?? null });
  if (!screen) return null;

  return (
    <FullWidthPageView
      title={screen.characterName}
      subtitle={campaign?.name}
      backTo={toCampaignDetailCharacters(campaignId)}
      backLabel="Retour aux personnages"
    >
      <CharacterBuilderView screen={screen} />
    </FullWidthPageView>
  );
}
