import { InvalidDomainError } from '@kernel/domain/domain.error';

export class InvalidEmailError extends InvalidDomainError {
  constructor() {
    super('Invalid email address');
  }
}

// Volontairement laxiste : le seul juge de la validité d'une adresse est
// l'arrivée du mail de vérification. On rejette ce qui ne peut pas être une
// adresse, pas ce qui est inhabituel.
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Adresse email d'un compte.
 *
 * `create` NORMALISE : minuscules et espaces retirés. C'est ce qui rend
 * l'unicité réellement insensible à la casse — sans quoi Alice@x.com et
 * alice@x.com sont deux comptes distincts, et une tentative de connexion peut
 * échouer selon la façon dont l'adresse a été tapée.
 */
export class Email {
  declare private readonly brand: 'Email';

  private constructor(readonly value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) throw new InvalidEmailError();

    return new Email(normalized);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
