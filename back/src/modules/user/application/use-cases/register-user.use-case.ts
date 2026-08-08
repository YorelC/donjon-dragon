import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';
import { createUser } from '../../domain/user.entity';
import {
  DisplayNameAlreadyTakenError,
  EmailAlreadyInUseError,
} from '../../domain/user.errors';
import { toPublicUser } from '../user.mapper';

export interface RegisterUserCommand {
  email: string;
  displayName: string;
  /** Déjà hashé : le hashage est une préoccupation d'auth, pas de user. */
  passwordHash: string;
}

/**
 * Seul point d'entrée pour créer un compte. Les invariants d'unicité sont
 * garantis ici, donc une seule fois — un appelant qui aurait le repository en
 * main pourrait les contourner, c'est pourquoi USER_REPOSITORY ne sort pas du
 * module.
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepositoryPort,
  ) {}

  async execute(command: RegisterUserCommand): Promise<PublicUser> {
    await this.assertUnique(command);

    const user = createUser(command);
    await this.userRepo.save(user);

    return toPublicUser(user);
  }

  private async assertUnique(command: RegisterUserCommand): Promise<void> {
    if (await this.userRepo.findByEmail(command.email)) {
      throw new EmailAlreadyInUseError();
    }
    if (await this.userRepo.findByDisplayName(command.displayName)) {
      throw new DisplayNameAlreadyTakenError();
    }
  }
}
