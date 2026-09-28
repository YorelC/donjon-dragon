import { FramedPanelView } from "@/shared/components/layout/framed-panel.view";
import { BackLink, type PageBack } from "@/shared/components/molecules/page-header";
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
 * suffit à s'orienter, et chaque colonne gagnée sert à jouer. Dès `lg`, elle tient
 * dans la hauteur de la fenêtre : seul le contenu des onglets défile.
 */
export function CharacterSheetPageView({ page, campaignId }: CharacterSheetPageViewProps) {
  return (
    <div className="flex min-h-0 flex-1 p-5">
      <FramedPanelView>
        <SheetBody page={page} back={{ to: toCampaignDetailCharacters(campaignId), label: BACK_LABEL }} />
      </FramedPanelView>
    </div>
  );
}

interface SheetBodyProps {
  page: CharacterSheetPageViewProps["page"];
  back: PageBack;
}

function SheetBody({ page, back }: SheetBodyProps) {
  if (!page.data) return <SheetPlaceholder page={page} back={back} />;

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <SheetHeaderView model={page.data} back={back} />
      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[500px_minmax(0,1fr)]">
        <SheetAbilitiesPanelView model={page.data} />
        <SheetTabsView model={page.data} />
      </div>
    </div>
  );
}

function SheetPlaceholder({ page, back }: SheetBodyProps) {
  return (
    <div className="flex flex-col gap-5">
      <BackLink back={back} />
      <p className="empty-state-text">
        {page.error ? "Cette fiche n'est pas disponible." : "Chargement de la fiche…"}
      </p>
    </div>
  );
}
