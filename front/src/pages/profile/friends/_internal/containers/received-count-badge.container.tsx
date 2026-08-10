import { useReceivedCount } from "../queries/use-received-count";
import { ReceivedCountBadgeView } from "../views/received-count-badge.view";

export function ReceivedCountBadgeContainer() {
  const { data } = useReceivedCount();

  // Les mutations accept/refuse invalident la clé ["friends", "received"], dont
  // celle du compteur est un préfixe : il se rafraîchit sans refetch manuel.
  if (!data?.count) return null;

  return <ReceivedCountBadgeView count={data.count} />;
}
