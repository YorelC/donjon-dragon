import { Inject, Injectable } from '@nestjs/common';
import type { PublicUser } from '@donjon-dragon/shared/user-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';

import {
  USER_REPOSITORY,
  type UserRepositoryPort,
} from '../ports/user-repository.port';
import { DisplayName } from '../../domain/display-name';
import { Email } from '../../domain/email';
import { User } from '../../domain/user';
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
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async execute(command: RegisterUserCommand): Promise<PublicUser> {
    const email = Email.create(command.email);
    const displayName = DisplayName.create(command.displayName);

    await this.assertUnique(email, displayName);

    const user = User.register({
      email,
      displayName,
      passwordHash: command.passwordHash,
      now: this.clock.now(),
    });
    await this.userRepo.save(user);

    return toPublicUser(user);
  }

  private async assertUnique(email: Email, displayName: DisplayName): Promise<void> {
    if (await this.userRepo.findByEmail(email)) {
      throw new EmailAlreadyInUseError();
    }
    if (await this.userRepo.findByDisplayName(displayName)) {
      throw new DisplayNameAlreadyTakenError();
    }
  }
}
