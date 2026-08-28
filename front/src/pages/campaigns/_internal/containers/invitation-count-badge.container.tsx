import { useCampaignInvitationCount } from "@/shared/queries/use-campaign-invitation-count";
import { CountBadge } from "@/shared/components/molecules/count-badge";

/**
 * Les mutations accepter/refuser invalident ["campaigns", "invitations"], dont la
 * clé du compteur est un préfixe : il se rafraîchit sans refetch manuel. Rien n'est
 * rendu à zéro : un compteur vide n'appelle à aucune action (INV-007).
 */
export function InvitationCountBadgeContainer() {
  const { data } = useCampaignInvitationCount();

  if (!data?.count) return null;

  return <CountBadge count={data.count} pending="demandes de campagne" />;
}
