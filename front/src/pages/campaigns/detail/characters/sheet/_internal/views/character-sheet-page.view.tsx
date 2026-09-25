import { PageHeader } from "@/shared/components/molecules/page-header";
import { toCampaignDetailCharacters } from "@/shared/constants/routes";
import type { QueryState } from "@/shared/types/ui-state";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { SheetIdentityPanelView } from "./sheet-identity-panel.view";
import { SheetTabsView } from "./sheet-tabs.view";

interface CharacterSheetPageViewProps {
  page: QueryState<CharacterSheetModel | null>;
  campaignId: string;
}

const PAGE_TITLE = "Fiche de personnage";
const BACK_LABEL = "Personnages de la campagne";

/** La fiche, dans le cadre de la campagne : identité à gauche, onglets à droite. */
export function CharacterSheetPageView({ page, campaignId }: CharacterSheetPageViewProps) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ to: toCampaignDetailCharacters(campaignId), label: BACK_LABEL }}
        title={PAGE_TITLE}
      />
      <SheetBody page={page} />
    </div>
  );
}

function SheetBody({ page }: { page: CharacterSheetPageViewProps["page"] }) {
  if (page.error) return <p className="empty-state-text">Cette fiche n'est pas disponible.</p>;
  if (!page.data) return <p className="empty-state-text">Chargement de la fiche…</p>;

  return (
    <div className="grid items-stretch gap-[22px] lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <SheetIdentityPanelView model={page.data} />
      <SheetTabsView model={page.data} />
    </div>
  );
}
