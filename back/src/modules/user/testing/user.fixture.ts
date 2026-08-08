import { DisplayName } from '../domain/display-name';
import { Email } from '../domain/email';
import { User } from '../domain/user';

/**
 * Fabrique un compte pour les tests, à partir de chaînes : un test décrit un
 * utilisateur, il n'a pas à assembler des value objects.
 */
export function aUser(params: {
  email: string;
  displayName: string;
  passwordHash?: string;
}): User {
  return User.register({
    email: Email.create(params.email),
    displayName: DisplayName.create(params.displayName),
    passwordHash: params.passwordHash ?? 'hashedpw',
  });
}
