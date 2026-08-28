import { useReceivedCount } from "@/shared/queries/use-received-count";
import { CountBadge } from "@/shared/components/molecules/count-badge";

/**
 * Les demandes d'amis en attente, frappées sur l'onglet Profil du bandeau. Rien
 * n'est rendu à zéro : un compteur vide n'appelle à aucune action (INV-007).
 */
export function ProfileRequestsBadge() {
  const { data } = useReceivedCount();

  if (!data?.count) return null;

  return <CountBadge count={data.count} />;
}
