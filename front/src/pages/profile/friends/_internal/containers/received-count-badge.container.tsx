import { useReceivedCount } from "@/shared/queries/use-received-count";
import { CountBadge } from "@/shared/components/molecules/count-badge";

export function ReceivedCountBadgeContainer() {
  const { data } = useReceivedCount();

  // Les mutations accept/refuse invalident la clé ["friends", "received"], dont
  // celle du compteur est un préfixe : il se rafraîchit sans refetch manuel.
  if (!data?.count) return null;

  return <CountBadge count={data.count} pending="demandes d'amis" />;
}
