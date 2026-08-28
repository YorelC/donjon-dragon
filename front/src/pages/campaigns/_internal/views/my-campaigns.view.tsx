import type { CampaignSummary } from "@donjon-dragon/shared";
import type { QueryState } from "@/shared/types/ui-state";
import { CampaignRow } from "./campaign-row.view";

interface MyCampaignsViewProps {
  campaigns: QueryState<CampaignSummary[]>;
}

export function MyCampaignsView({ campaigns }: MyCampaignsViewProps) {
  if (campaigns.loading)
    return <div className="empty-state-text">Chargement...</div>;
  if (campaigns.error)
    return (
      <div className="empty-state-text">
        Erreur lors du chargement des campagnes.
      </div>
    );
  if (campaigns.data.length === 0)
    return (
      <div className="empty-state-text">
        Tu ne participes à aucune campagne. Crée la première.
      </div>
    );

  return (
    <ul className="flex flex-col gap-2.5">
      {campaigns.data.map((campaign) => (
        <CampaignRow key={campaign.id} campaign={campaign} />
      ))}
    </ul>
  );
}
