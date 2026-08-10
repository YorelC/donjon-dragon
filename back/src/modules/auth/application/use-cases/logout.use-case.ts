import { Inject, Injectable } from '@nestjs/common';
import { UserId } from '@kernel/domain/user-id';
import type { ActorId } from '@kernel/domain/actor-id';
import { CLOCK, type Clock } from '@kernel/application/clock.port';

import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { TokenSecret } from '../../domain/token-secret';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepositoryPort,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  /**
   * `userId` vient du JWT, `plainToken` du corps de la requête : on ne révoque
   * que si les deux désignent la même personne. Sans ce contrôle, présenter le
   * refresh token d'autrui révoquait toute sa lignée de tokens.
   *
   * Volontairement idempotent et muet : un token inconnu ou appartenant à
   * quelqu'un d'autre ne produit pas d'erreur — se déconnecter réussit toujours,
   * et la réponse ne révèle pas si un token existe.
   */
  async execute(userId: ActorId, plainToken: string): Promise<void> {
    const token = await this.refreshRepo.findBySecret(
      TokenSecret.fromPlain(plainToken),
    );
    if (!token?.belongsTo(UserId.create(userId))) return;

    await this.refreshRepo.revokeFamily(token.familyId, this.clock.now());
  }
}
