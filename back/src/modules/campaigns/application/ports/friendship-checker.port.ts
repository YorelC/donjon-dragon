export const FRIENDSHIP_CHECKER = Symbol('FRIENDSHIP_CHECKER');

/**
 * Anti-corruption layer vers `friendship`, réduite au seul fait dont le contexte
 * campagne a besoin : ces deux-là sont-ils amis ?
 *
 * Le module ne connaît ni l'agrégat `Friendship`, ni ses statuts, ni sa direction
 * requester → recipient. Une évolution du modèle d'amitié — une amitié à
 * plusieurs états, un blocage — ne se voit pas d'ici tant que la réponse à cette
 * question reste un booléen.
 */
export interface FriendshipCheckerPort {
  areFriends(userId: string, otherUserId: string): Promise<boolean>;
}
