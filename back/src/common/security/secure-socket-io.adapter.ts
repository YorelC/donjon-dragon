import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { IncomingMessage } from 'http';

type HandshakeDecision = (error: string | null, success: boolean) => void;

export class SecureSocketIoAdapter extends IoAdapter {
  private readonly allowedOrigins: ReadonlySet<string>;

  constructor(app: INestApplicationContext, origins: readonly string[]) {
    super(app);
    this.allowedOrigins = new Set(origins);
  }

  createIOServer(
    port: number,
    options: Record<string, unknown> = {},
  ): unknown {
    return super.createIOServer(port, {
      ...options,
      cors: { origin: [...this.allowedOrigins], credentials: true },
      allowRequest: (request: IncomingMessage, decide: HandshakeDecision) =>
        this.decideOrigin(request, decide),
    });
  }

  private decideOrigin(
    request: IncomingMessage,
    decide: HandshakeDecision,
  ): void {
    const origin = request.headers.origin;
    const allowed = isAllowedSocketOrigin(origin, this.allowedOrigins);
    decide(allowed ? null : 'Origin WebSocket refusée', allowed);
  }
}

export function isAllowedSocketOrigin(
  origin: string | undefined,
  allowedOrigins: ReadonlySet<string>,
): boolean {
  return typeof origin === 'string' && allowedOrigins.has(origin);
}
