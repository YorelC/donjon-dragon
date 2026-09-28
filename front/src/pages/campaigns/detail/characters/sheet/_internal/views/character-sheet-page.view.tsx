import { FramedPanelView } from "@/shared/components/layout/framed-panel.view";
import type { QueryState } from "@/shared/types/ui-state";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { SheetAbilitiesPanelView } from "./sheet-abilities.view";
import { SheetHeaderView } from "./sheet-header.view";
import { SheetTabsView } from "./sheet-tabs.view";

interface CharacterSheetPageViewProps {
  page: QueryState<CharacterSheetModel | null>;
}

/**
 * La fiche prend tout l'écran, sans la barre de la campagne : le fil d'Ariane du
 * bandeau suffit à s'orienter, et chaque colonne gagnée sert à jouer. Dès `lg`,
 * elle tient dans la hauteur de la fenêtre : seul le contenu des onglets défile.
 */
export function CharacterSheetPageView({ page }: CharacterSheetPageViewProps) {
  return (
    <div className="flex min-h-0 flex-1 px-5 py-3">
      <FramedPanelView>
        <SheetBody page={page} />
      </FramedPanelView>
    </div>
  );
}

function SheetBody({ page }: CharacterSheetPageViewProps) {
  if (!page.data) return <SheetPlaceholder page={page} />;

  return (
    <div className="flex flex-col gap-3 lg:h-full lg:min-h-0">
      <SheetHeaderView model={page.data} />
      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[470px_minmax(0,1fr)] 2xl:grid-cols-[540px_minmax(0,1fr)]">
        <SheetAbilitiesPanelView model={page.data} />
        <SheetTabsView model={page.data} />
      </div>
    </div>
  );
}

function SheetPlaceholder({ page }: CharacterSheetPageViewProps) {
  return (
    <p className="empty-state-text">
      {page.error ? "Cette fiche n'est pas disponible." : "Chargement de la fiche…"}
    </p>
  );
}
