// Modes d'échec du domaine auth — pinnés par les tests, mappés en codes
// HTTP par l'interface (GREEN). Zéro I/O.

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailAlreadyInUseError extends Error {
  constructor() {
    super('Email already in use');
    this.name = 'EmailAlreadyInUseError';
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super('Invalid refresh token');
    this.name = 'InvalidRefreshTokenError';
  }
}

export class TokenReuseDetectedError extends Error {
  constructor() {
    super('Refresh token reuse detected');
    this.name = 'TokenReuseDetectedError';
  }
}

export class RefreshTokenExpiredError extends Error {
  constructor() {
    super('Refresh token expired');
    this.name = 'RefreshTokenExpiredError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User not found');
    this.name = 'UserNotFoundError';
  }
}
