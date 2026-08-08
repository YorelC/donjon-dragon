// Modes d'échec du domaine auth — purs, zéro I/O.
// Chacun déclare sa nature via la classe dont il hérite ; la traduction en
// statut HTTP est faite une seule fois par common/filters/domain-exception.filter.

import {
  ConflictDomainError,
  NotFoundDomainError,
  ForbiddenDomainError,
  UnauthorizedDomainError,
} from '@kernel/domain/domain.error';

export class EmailAlreadyInUseError extends ConflictDomainError {
  constructor() {
    super('Email already in use');
  }
}

export class UserNotFoundError extends NotFoundDomainError {
  constructor() {
    super('User not found');
  }
}

export class EmailNotVerifiedError extends ForbiddenDomainError {
  constructor() {
    super('Email not verified');
  }
}

export class InvalidCredentialsError extends UnauthorizedDomainError {
  constructor() {
    super('Invalid credentials');
  }
}

export class InvalidRefreshTokenError extends UnauthorizedDomainError {
  constructor() {
    super('Invalid refresh token');
  }
}

export class TokenReuseDetectedError extends UnauthorizedDomainError {
  constructor() {
    super('Refresh token reuse detected');
  }
}

export class RefreshTokenExpiredError extends UnauthorizedDomainError {
  constructor() {
    super('Refresh token expired');
  }
}

export class InvalidVerificationTokenError extends UnauthorizedDomainError {
  constructor() {
    super('Invalid verification token');
  }
}

export class VerificationTokenExpiredError extends UnauthorizedDomainError {
  constructor() {
    super('Verification token expired');
  }
}
