import { useInvitationCount } from "../queries/use-invitation-count";
import { InvitationCountBadgeView } from "../views/invitation-count-badge.view";

export function InvitationCountBadgeContainer() {
  const { data } = useInvitationCount();

  // Les mutations accepter/refuser invalident ["campaigns", "invitations"], dont
  // la clé du compteur est un préfixe : il se rafraîchit sans refetch manuel.
  if (!data?.count) return null;

  return <InvitationCountBadgeView count={data.count} />;
}
