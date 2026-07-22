import type { PasswordHasherPort } from '../../../../src/auth/domain/password-hasher.port.js';

// Double de test déterministe : `hashed:<plain>`.
export class FakePasswordHasher implements PasswordHasherPort {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
