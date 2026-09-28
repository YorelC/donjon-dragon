import { FramedPanelView } from "@/shared/components/layout/framed-panel.view";
import { BackLink } from "@/shared/components/molecules/page-header";
import { toCampaignDetailCharacters } from "@/shared/constants/routes";
import type { QueryState } from "@/shared/types/ui-state";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { SheetAbilitiesPanelView } from "./sheet-abilities.view";
import { SheetHeaderView } from "./sheet-header.view";
import { SheetTabsView } from "./sheet-tabs.view";

interface CharacterSheetPageViewProps {
  page: QueryState<CharacterSheetModel | null>;
  campaignId: string;
}

/** On vient toujours de la liste de la campagne : le contexte n'a pas besoin d'être répété. */
const BACK_LABEL = "Personnages";

/**
 * La fiche prend tout l'écran, sans la barre de la campagne : le lien de retour
 * suffit à s'orienter, et chaque colonne gagnée sert à jouer.
 */
export function CharacterSheetPageView({ page, campaignId }: CharacterSheetPageViewProps) {
  return (
    <div className="flex min-h-0 flex-1 p-5">
      <FramedPanelView>
        <div className="flex flex-col gap-5">
          <BackLink back={{ to: toCampaignDetailCharacters(campaignId), label: BACK_LABEL }} />
          <SheetBody page={page} />
        </div>
      </FramedPanelView>
    </div>
  );
}

function SheetBody({ page }: { page: CharacterSheetPageViewProps["page"] }) {
  if (page.error) return <p className="empty-state-text">Cette fiche n'est pas disponible.</p>;
  if (!page.data) return <p className="empty-state-text">Chargement de la fiche…</p>;

  return (
    <div className="flex flex-col gap-5">
      <SheetHeaderView model={page.data} />
      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <SheetAbilitiesPanelView model={page.data} />
        <SheetTabsView model={page.data} />
      </div>
    </div>
  );
}
