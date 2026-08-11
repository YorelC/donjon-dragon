import { Link } from "react-router-dom";
import type { CampaignRole, CampaignSummary } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Card, CardContent } from "@/shared/components/atoms/card";
import { toCampaignDetail } from "@/shared/constants/routes";
import type { QueryState } from "@/shared/types/ui-state";

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
    <div className="space-y-2">
      {campaigns.data.map((campaign) => (
        <CampaignRow key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}

/**
 * La carte entière est le lien : depuis que l'invitation vit dans le détail, la
 * ligne ne contient plus rien d'autre de cliquable, donc aucun risque d'imbriquer
 * deux éléments interactifs.
 */
function CampaignRow({ campaign }: { campaign: CampaignSummary }) {
  return (
    <Link to={toCampaignDetail(campaign.id)} className="block">
      <Card className="transition-colors hover:bg-accent">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="grid gap-0.5">
            <span className="font-medium">{campaign.name}</span>
            <CampaignHeadcount campaign={campaign} />
          </div>
          <RoleBadge role={campaign.myRole} />
        </CardContent>
      </Card>
    </Link>
  );
}

function CampaignHeadcount({ campaign }: { campaign: CampaignSummary }) {
  return (
    <span className="muted-text-xs">
      {pluralize(campaign.gameMasterCount, "maître du jeu", "maîtres du jeu")} ·{" "}
      {pluralize(campaign.playerCount, "joueur", "joueurs")}
    </span>
  );
}

const ROLE_LABELS: Record<CampaignRole, string> = {
  gameMaster: "Maître du jeu",
  player: "Joueur",
};

const ROLE_VARIANTS: Record<CampaignRole, "default" | "secondary"> = {
  gameMaster: "default",
  player: "secondary",
};

function RoleBadge({ role }: { role: CampaignRole }) {
  return <Badge variant={ROLE_VARIANTS[role]}>{ROLE_LABELS[role]}</Badge>;
}

const PLURAL_FROM = 2;

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count >= PLURAL_FROM ? plural : singular}`;
}
