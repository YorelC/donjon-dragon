import { Injectable } from '@nestjs/common';
import { hash, compare } from 'bcryptjs';
import type { PasswordHasherPort } from '../../application/ports/password-hasher.port';

export const DEFAULT_BCRYPT_ROUNDS = 12;

/**
 * Le coût est reçu en valeur, pas via ConfigService : ça garde l'adapter
 * utilisable hors du conteneur Nest (scripts/seed-users.script.ts l'instancie
 * à la main) tout en le rendant configurable par l'environnement.
 */
@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  constructor(private readonly rounds: number = DEFAULT_BCRYPT_ROUNDS) {}

  async hash(plain: string): Promise<string> {
    return hash(plain, this.rounds);
  }

  async verify(plain: string, hashValue: string): Promise<boolean> {
    return compare(plain, hashValue);
  }
}
