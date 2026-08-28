import { MESSAGE_MAPPING_METADATA } from '@nestjs/websockets/constants';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REALTIME_EVENT } from '@donjon-dragon/shared/realtime-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import type { SessionRevocationListener } from '@kernel/application/session-revocation.port';
import { ACCESS_COOKIE } from '@common/security/session-cookie.constants';
import type { VerifyAccessTokenUseCase } from '@modules/auth/application/use-cases/verify-access-token.use-case';
import { RealtimeGateway } from './realtime.gateway';

type Socket = Parameters<RealtimeGateway['handleConnection']>[0];
type Middleware = (socket: Socket, next: (error?: Error) => void) => void;

const ALICE_ID = '11111111-1111-4111-8111-111111111111' as ActorId;
const BOB_ID = '22222222-2222-4222-8222-222222222222' as ActorId;
const ALICE_ROOM = `user:${ALICE_ID}`;
const NOW = new Date('2026-08-28T10:00:00.000Z');
const TOKEN_TTL_MS = 15 * 60 * 1000;

describe('RealtimeGateway — handshake', () => {
  it('refuse une connexion sans cookie de session', async () => {
    const refusal = await handshake(aSocket({ cookie: undefined }));

    expect(refusal).toBeInstanceOf(Error);
  });

  it('refuse un token que le vérificateur rejette', async () => {
    const refusal = await handshake(aSocket(), refusingVerifier());

    expect(refusal).toBeInstanceOf(Error);
  });

  it('accepte un token vérifié et retient la session', async () => {
    const socket = aSocket();

    const refusal = await handshake(socket, acceptingVerifier());

    expect(refusal).toBeUndefined();
    expect(socket.data).toEqual({ userId: ALICE_ID, expiresAtMs: expiry() });
  });
});

describe('RealtimeGateway — connexion', () => {
  it('range la socket dans la room personnelle de son utilisateur', () => {
    const socket = anAuthenticatedSocket();

    gateway().handleConnection(socket);

    expect(socket.join).toHaveBeenCalledWith(ALICE_ROOM);
  });

  // Chemin defensif : le middleware a deja refuse, mais une socket sans session
  // ne doit jamais rejoindre quoi que ce soit.
  it('déconnecte une socket sans session', () => {
    const socket = aSocket();

    gateway().handleConnection(socket);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });
});

describe('RealtimeGateway — cycle de vie de la session', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  // Le JWT d'acces vaut 15 minutes ; une socket authentifiee une fois ne doit pas
  // rester autorisee au-dela.
  it('annonce l expiration puis déconnecte à l échéance du token', () => {
    const socket = anAuthenticatedSocket();
    gateway().handleConnection(socket);

    vi.advanceTimersByTime(TOKEN_TTL_MS);

    expect(socket.emit).toHaveBeenCalledWith(REALTIME_EVENT.sessionExpired);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });

  it('abandonne l échéance si la socket part avant', () => {
    const socket = anAuthenticatedSocket();
    gateway().handleConnection(socket);

    disconnectListenerOf(socket)();
    vi.advanceTimersByTime(TOKEN_TTL_MS);

    expect(socket.emit).not.toHaveBeenCalled();
  });
});

describe('RealtimeGateway — révocation', () => {
  it('déconnecte les sockets de l utilisateur qui se déconnecte', () => {
    const revocations = aRevocationBus();
    const emitter = anEmitter();
    const server = aServer(emitter);
    started(new RealtimeGateway(acceptingVerifier(), revocations), server);

    revocations.publish(ALICE_ID);

    expect(server.in).toHaveBeenCalledWith(ALICE_ROOM);
    expect(emitter.disconnectSockets).toHaveBeenCalledWith(true);
  });

  it('reste sans effet tant que le serveur n est pas initialisé', () => {
    const revocations = aRevocationBus();
    new RealtimeGateway(acceptingVerifier(), revocations);

    expect(() => revocations.publish(ALICE_ID)).not.toThrow();
  });
});

describe('RealtimeGateway — diffusion', () => {
  it('cible les rooms personnelles, sans doublon', () => {
    const emitter = anEmitter();
    const server = aServer(emitter);
    const instance = started(gateway(), server);

    instance.notifyUsers([ALICE_ID, BOB_ID, ALICE_ID], aPayload());

    expect(server.to).toHaveBeenCalledWith([ALICE_ROOM, `user:${BOB_ID}`]);
    expect(emitter.emit).toHaveBeenCalledWith(
      REALTIME_EVENT.resourceChanged,
      aPayload(),
    );
  });
});

/**
 * Conformite, miroir du bloc « protection des routes » des controllers : le
 * transport temps reel est sortant. Aucune commande metier n'y entre, et cette
 * regle doit casser au test plutot que de s'oublier dans six mois.
 */
describe('RealtimeGateway — aucun message entrant', () => {
  const handlers = prototypeMethods();

  it.each(handlers)('%s ne déclare pas @SubscribeMessage', (method) => {
    const handler = Reflect.get(RealtimeGateway.prototype, method) as object;
    expect(Reflect.getMetadata(MESSAGE_MAPPING_METADATA, handler)).toBeUndefined();
  });

  // Sans ça, le jour où l'introspection ne rend plus rien, la garde ci-dessus
  // passerait à vide au lieu de tomber.
  it('a bien inspecté les méthodes de la gateway', () => {
    expect(handlers).toContain('handleConnection');
    expect(handlers).toContain('notifyUsers');
  });
});

/** `@WebSocketServer()` pose une propriété sur le prototype : ce n'est pas un handler. */
function prototypeMethods(): string[] {
  return Object.getOwnPropertyNames(RealtimeGateway.prototype).filter(
    (name) =>
      name !== 'constructor' &&
      typeof Reflect.get(RealtimeGateway.prototype, name) === 'function',
  );
}

function expiry(): number {
  return NOW.getTime() + TOKEN_TTL_MS;
}

function aPayload() {
  return { messageId: BOB_ID, resource: 'friendships' } as const;
}

function gateway(): RealtimeGateway {
  return new RealtimeGateway(acceptingVerifier(), aRevocationBus());
}

/** Rejoue ce que Nest fait au démarrage : poser le serveur et son middleware. */
function started(instance: RealtimeGateway, server: FakeServer): RealtimeGateway {
  Reflect.set(instance, 'server', server);
  instance.afterInit(server as never);
  return instance;
}

/**
 * Le middleware ne rend pas sa promesse (`void this.authenticate(...)`) : on
 * attend l'appel a `next`, pas le retour de la fonction.
 */
async function handshake(
  socket: Socket,
  verifier: VerifyAccessTokenUseCase = refusingVerifier(),
): Promise<Error | undefined> {
  const server = aServer(anEmitter());
  started(new RealtimeGateway(verifier, aRevocationBus()), server);
  const middleware = server.use.mock.calls[0]?.[0] as Middleware;

  return new Promise((resolve) => middleware(socket, resolve));
}

function acceptingVerifier(): VerifyAccessTokenUseCase {
  return {
    execute: vi.fn().mockResolvedValue({
      userId: ALICE_ID,
      expiresAtMs: expiry(),
    }),
  } as unknown as VerifyAccessTokenUseCase;
}

function refusingVerifier(): VerifyAccessTokenUseCase {
  return {
    execute: vi.fn().mockResolvedValue(null),
  } as unknown as VerifyAccessTokenUseCase;
}

function aRevocationBus() {
  const listeners: SessionRevocationListener[] = [];
  return {
    subscribe(listener: SessionRevocationListener) {
      listeners.push(listener);
      return () => listeners.splice(listeners.indexOf(listener), 1);
    },
    publish(userId: ActorId) {
      listeners.forEach((listener) => listener(userId));
    },
  };
}

function anEmitter() {
  return { emit: vi.fn(), disconnectSockets: vi.fn() };
}

type FakeServer = ReturnType<typeof aServer>;

function aServer(emitter: ReturnType<typeof anEmitter>) {
  return {
    use: vi.fn(),
    to: vi.fn(() => emitter),
    in: vi.fn(() => emitter),
  };
}

function aSocket({ cookie = `${ACCESS_COOKIE}=signed-token` } = {}): Socket {
  return {
    id: 'socket-1',
    data: {},
    handshake: { headers: { cookie } },
    join: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
  } as unknown as Socket;
}

function anAuthenticatedSocket(): Socket {
  const socket = aSocket();
  socket.data = { userId: ALICE_ID, expiresAtMs: expiry() };
  return socket;
}

function disconnectListenerOf(socket: Socket): () => void {
  const on = socket.on as unknown as ReturnType<typeof vi.fn>;
  return on.mock.calls[0]?.[1] as () => void;
}
