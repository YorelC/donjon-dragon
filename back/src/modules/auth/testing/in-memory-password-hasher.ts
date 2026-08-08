import type { PasswordHasherPort } from '../application/ports/password-hasher.port';

export class InMemoryPasswordHasher implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    return `hashed_${password}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed_${password}`;
  }
}
