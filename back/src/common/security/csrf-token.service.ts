import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const RANDOM_BYTES = 32;
const SEPARATOR = '.';

/**
 * Jeton CSRF en double-submit SIGNÉ.
 *
 * Le double-submit naïf compare un cookie lisible à un en-tête : il tombe dès
 * qu'un sous-domaine hostile peut écrire un cookie sur le domaine parent, car il
 * contrôle alors les deux moitiés de la comparaison.
 *
 * Ici le jeton porte un HMAC qui le lie à l'utilisateur de la session. Un jeton
 * fabriqué par un tiers ne passe pas la vérification de signature, et un jeton
 * valide volé à quelqu'un d'autre ne correspond pas à l'identité de la requête.
 *
 * La clé dérive de JWT_SECRET par séparation de domaine, ce qui évite une
 * variable d'environnement de plus sans réutiliser la même clé pour deux usages.
 */
@Injectable()
export class CsrfTokenService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const jwtSecret = config.getOrThrow<string>('jwt.secret');
    this.key = createHmac('sha256', jwtSecret).update('csrf-token-key').digest();
  }

  /** Émis à chaque ouverture ou rotation de session (anti session fixation). */
  issue(userId: string): string {
    const nonce = randomBytes(RANDOM_BYTES).toString('base64url');
    return `${nonce}${SEPARATOR}${this.sign(nonce, userId)}`;
  }

  /** Le jeton est-il bien le nôtre, et celui de CETTE session ? */
  matches(token: string | undefined, userId: string): boolean {
    if (!token) return false;

    const [nonce, signature] = token.split(SEPARATOR);
    if (!nonce || !signature) return false;

    return equalsInConstantTime(signature, this.sign(nonce, userId));
  }

  private sign(nonce: string, userId: string): string {
    return createHmac('sha256', this.key)
      .update(`${nonce}:${userId}`)
      .digest('base64url');
  }
}

// Comparaison a duree constante : une comparaison naive fuit la signature
// attendue octet par octet.
function equalsInConstantTime(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}
