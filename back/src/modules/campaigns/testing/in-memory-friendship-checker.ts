import type { FriendshipCheckerPort } from '../application/ports/friendship-checker.port';

/**
 * Double de l'amitié vue depuis les campagnes. Les paires sont enregistrées dans
 * les deux sens à l'ajout : le port répond à une question symétrique, le double
 * doit l'être aussi, sinon un test passerait dans un sens et pas dans l'autre.
 */
export class InMemoryFriendshipChecker implements FriendshipCheckerPort {
  private readonly pairs = new Set<string>();

  /** Commodité de test absente du port. */
  makeFriends(userId: string, otherUserId: string): void {
    this.pairs.add(pairKey(userId, otherUserId));
    this.pairs.add(pairKey(otherUserId, userId));
  }

  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    return this.pairs.has(pairKey(userId, otherUserId));
  }
}

const pairKey = (userId: string, otherUserId: string): string =>
  `${userId}::${otherUserId}`;
