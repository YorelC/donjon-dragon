import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';
import { UserId } from '@kernel/domain/user-id';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';
import { UserNotFoundError } from '../../domain/user.errors';
import { toPublicUser } from '../user.mapper';

/** Transition de l'agrégat : elle appartient à user, pas au module qui la déclenche. */
@Injectable()
export class MarkEmailVerifiedUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(userId: string): Promise<PublicUser> {
    const user = await this.userRepo.findById(UserId.create(userId));
    if (!user) throw new UserNotFoundError();

    user.markEmailVerified();
    await this.userRepo.save(user);

    return toPublicUser(user);
  }
}
