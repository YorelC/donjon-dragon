import { createHash, randomBytes } from 'crypto';

const SECRET_BYTES = 32;

/**
 * Secret opaque présenté par le porteur (refresh token, lien de vérification).
 *
 * Ce type ne contient QUE le hash : la valeur en clair n'existe qu'une fois, au
 * moment de l'émission, et elle est renvoyée séparément à l'appelant qui doit
 * la transmettre. Il devient donc structurellement impossible de persister ou
 * de journaliser le secret en clair — la seule chose qu'un TokenSecret sait
 * dire, c'est son empreinte.
 */
export class TokenSecret {
  declare private readonly brand: 'TokenSecret';

  private constructor(readonly hash: string) {}

  /** Émet un secret neuf. Le clair est rendu à part, et n'est plus jamais dérivable. */
  static issue(): { secret: TokenSecret; plainToken: string } {
    const plainToken = randomBytes(SECRET_BYTES).toString('hex');
    return { secret: new TokenSecret(digest(plainToken)), plainToken };
  }

  /** Pour retrouver un secret présenté par un client. */
  static fromPlain(plainToken: string): TokenSecret {
    return new TokenSecret(digest(plainToken));
  }

  /** Pour réhydrater depuis la persistance, qui ne stocke que l'empreinte. */
  static fromHash(hash: string): TokenSecret {
    return new TokenSecret(hash);
  }

  equals(other: TokenSecret): boolean {
    return this.hash === other.hash;
  }
}

function digest(plainToken: string): string {
  return createHash('sha256').update(plainToken).digest('hex');
}
