import type { ComputedCharacter } from "@donjon-dragon/shared";
import { CharacterSheetView } from "@/shared/components/character/character-sheet.view";
import { FullWidthPageView } from "@/shared/components/layout/full-width-page.view";
import { toCampaignDetailCharacters } from "@/shared/constants/routes";
import type { QueryState } from "@/shared/types/ui-state";

interface CharacterSheetPageViewProps {
  sheet: QueryState<ComputedCharacter | null>;
  character: { name: string; campaignId: string; campaignName?: string };
  skillLabels: Partial<Record<string, string>> | null;
}

/** La page de la fiche : son en-tête de retour, et l'état de la lecture. */
export function CharacterSheetPageView({
  sheet,
  character,
  skillLabels,
}: CharacterSheetPageViewProps) {
  if (sheet.error)
    return <p className="empty-state-text">Cette fiche n'est pas disponible.</p>;
  if (!sheet.data || !skillLabels) return null;

  return (
    <FullWidthPageView
      title={character.name}
      subtitle={character.campaignName}
      backTo={toCampaignDetailCharacters(character.campaignId)}
      backLabel="Retour aux personnages"
    >
      <CharacterSheetView
        name={character.name}
        sheet={sheet.data}
        skillLabels={skillLabels}
      />
    </FullWidthPageView>
  );
}
