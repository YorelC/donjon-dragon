import { useCampaignInvitationCount } from "@/shared/queries/use-campaign-invitation-count";
import { CountBadge } from "@/shared/components/molecules/count-badge";

/**
 * Les invitations de campagne en attente, frappées sur l'onglet Campagnes du
 * bandeau. Rien n'est rendu à zéro : un compteur vide n'appelle à aucune action
 * (INV-007).
 */
export function CampaignInvitesBadge() {
  const { data } = useCampaignInvitationCount();

  if (!data?.count) return null;

  return <CountBadge count={data.count} pending="demandes de campagne" />;
}
