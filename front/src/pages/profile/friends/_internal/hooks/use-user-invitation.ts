import { useSentRequests } from "../queries/use-sent-requests";
import { useSendFriendRequest } from "../queries/use-send-friend-request";
import type { SentRequest } from "../types/friends-schema";

/**
 * Envoyer une invitation, et savoir à qui on en a déjà envoyé une.
 *
 * `sendingTo` porte le pseudo en cours d'envoi, pas un booléen global : la
 * mutation est partagée par toute la liste de résultats, donc un `isPending`
 * global désactivait et relabellisait TOUS les boutons "Envoyer" à chaque clic,
 * pas seulement celui cliqué.
 */
export interface UserInvitation {
  onSend: (displayName: string) => void;
  pendingRecipients: Set<string>;
  sendingTo: string | null;
}

export function useUserInvitation(): UserInvitation {
  const sentQuery = useSentRequests(true);
  const sendMutation = useSendFriendRequest();

  return {
    onSend: sendMutation.mutate,
    pendingRecipients: toPendingRecipients(sentQuery.data),
    sendingTo: sendMutation.isPending ? (sendMutation.variables ?? null) : null,
  };
}

// Les demandes déjà envoyées désactivent le bouton « Ajouter » du résultat.
// Le rapprochement se fait par pseudo, qui porte un index unique en base : le
// serveur ne divulgue plus l'identifiant des autres joueurs.
function toPendingRecipients(requests: SentRequest[] | undefined): Set<string> {
  return new Set((requests ?? []).map((request) => request.recipient.displayName));
}
