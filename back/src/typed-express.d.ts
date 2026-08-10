import type { AuthenticatedActor } from '@kernel/domain/actor-id';

declare global {
  namespace Express {
    // Ce que la JwtStrategy renvoie depuis validate() devient request.user.
    // On augmente Express.User (le point d'extension de @types/passport) plutôt
    // que Request.user directement : sinon la déclaration de passport écrase
    // la nôtre et request.user retombe sur une interface vide.
    interface User extends AuthenticatedActor {}
  }
}

export {};
