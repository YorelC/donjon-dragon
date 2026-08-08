import { hash, compare } from 'bcryptjs';
import type { PasswordHasherPort } from '../../application/ports/password-hasher.port';

export class BcryptPasswordHasher implements PasswordHasherPort {
  async hash(plain: string): Promise<string> {
    return hash(plain, 10);
  }

  async verify(plain: string, hashValue: string): Promise<boolean> {
    return compare(plain, hashValue);
  }
}
