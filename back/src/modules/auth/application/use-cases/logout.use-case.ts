import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepositoryPort,
} from '../ports/refresh-token.repository.port';
import { hashRefreshToken } from '../../domain/token/refresh-token.entity';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshRepo: RefreshTokenRepositoryPort,
  ) {}

  /**
   * `userId` vient du JWT, `plainToken` du corps de la requête : on ne révoque
   * que si les deux désignent la même personne. Sans ce contrôle, présenter le
   * refresh token d'autrui révoquait toute sa famille de tokens.
   *
   * Volontairement idempotent et muet : un token inconnu ou appartenant à
   * quelqu'un d'autre ne produit pas d'erreur — se déconnecter réussit toujours,
   * et la réponse ne révèle pas si un token existe.
   */
  async execute(userId: string, plainToken: string): Promise<void> {
    const record = await this.refreshRepo.findByTokenHash(hashRefreshToken(plainToken));
    if (record?.userId !== userId) return;

    await this.refreshRepo.revokeFamily(record.familyId);
  }
}
