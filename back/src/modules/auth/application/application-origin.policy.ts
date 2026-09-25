import { InvalidDomainError } from '@kernel/domain/domain.error';

export class UntrustedApplicationOriginError extends InvalidDomainError {
  constructor() {
    super('Application origin is not allowed');
  }
}

export class ApplicationOriginPolicy {
  private readonly allowedOrigins: ReadonlySet<string>;

  constructor(origins: readonly string[]) {
    this.allowedOrigins = new Set(origins.map(normalizeOrigin));
  }

  authorize(candidate: string): string {
    const origin = normalizeOrigin(candidate);
    if (!this.allowedOrigins.has(origin)) throw new UntrustedApplicationOriginError();
    return origin;
  }
}

function normalizeOrigin(value: string): string {
  return new URL(value).origin;
}
