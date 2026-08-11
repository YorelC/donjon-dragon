import { Injectable } from '@nestjs/common';

import { AreFriendsUseCase } from '@modules/friendship/application/use-cases/are-friends.use-case';
import type { FriendshipCheckerPort } from '../../application/ports/friendship-checker.port';

/**
 * SEUL fichier du module campagne qui connaît le module friendship.
 *
 * Il appelle le use-case exporté par `FriendshipModule`, jamais
 * FRIENDSHIP_REPOSITORY : la cloison `ports-are-module-private` l'interdit, et
 * avec le repository en main on contournerait les invariants de l'amitié.
 */
@Injectable()
export class FriendshipChecker implements FriendshipCheckerPort {
  constructor(private readonly areFriendsUseCase: AreFriendsUseCase) {}

  async areFriends(userId: string, otherUserId: string): Promise<boolean> {
    return this.areFriendsUseCase.execute({ userId, otherUserId });
  }
}
