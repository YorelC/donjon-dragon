import { Inject, OnModuleDestroy } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  REALTIME_EVENT,
  type RealtimeResourceChanged,
} from '@donjon-dragon/shared/realtime-schema';
import type { ActorId } from '@kernel/domain/actor-id';
import {
  SESSION_REVOCATION_SUBSCRIBER,
  type SessionRevocationSubscriberPort,
} from '@kernel/application/session-revocation.port';
import { ACCESS_COOKIE } from '@common/security/session-cookie.constants';
import { VerifyAccessTokenUseCase } from '@modules/auth/application/use-cases/verify-access-token.use-case';

const SOCKET_PATH = '/api/socket.io';
const USER_ROOM_PREFIX = 'user:';
const UNAUTHORIZED_CONNECTION = 'unauthorized';

type SocketMiddlewareNext = (error?: Error) => void;

interface RealtimeSocket {
  id: string;
  data: { userId?: ActorId; expiresAtMs?: number };
  handshake: { headers: { cookie?: string } };
  join(room: string): Promise<void> | void;
  emit(event: string): void;
  disconnect(close?: boolean): void;
  on(event: 'disconnect', listener: () => void): void;
}

interface RoomEmitter {
  emit(event: string, payload: RealtimeResourceChanged): void;
  disconnectSockets(close?: boolean): void;
}

interface RealtimeServer {
  use(middleware: (socket: RealtimeSocket, next: SocketMiddlewareNext) => void): void;
  to(room: string | string[]): RoomEmitter;
  in(room: string): RoomEmitter;
}

@WebSocketGateway({ path: SOCKET_PATH, transports: ['websocket'] })
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnModuleDestroy
{
  @WebSocketServer()
  private server!: RealtimeServer;
  private readonly unsubscribeRevocations: () => void;

  constructor(
    private readonly verifyAccessToken: VerifyAccessTokenUseCase,
    @Inject(SESSION_REVOCATION_SUBSCRIBER)
    revocations: SessionRevocationSubscriberPort,
  ) {
    this.unsubscribeRevocations = revocations.subscribe((userId) =>
      this.disconnectUser(userId),
    );
  }

  onModuleDestroy(): void {
    this.unsubscribeRevocations();
  }

  afterInit(server: RealtimeServer): void {
    server.use((socket, next) => void this.authenticate(socket, next));
  }

  handleConnection(socket: RealtimeSocket): void {
    const session = authenticatedSession(socket);
    if (!session) return socket.disconnect(true);
    void socket.join(userRoom(session.userId));
    this.disconnectWhenExpired(socket, session.expiresAtMs);
  }

  notifyUsers(userIds: readonly string[], payload: RealtimeResourceChanged): void {
    const rooms = [...new Set(userIds)].map(userRoom);
    this.server.to(rooms).emit(REALTIME_EVENT.resourceChanged, payload);
  }

  private async authenticate(
    socket: RealtimeSocket,
    next: SocketMiddlewareNext,
  ): Promise<void> {
    const token = cookieValue(socket.handshake.headers.cookie, ACCESS_COOKIE);
    const session = token ? await this.verifyAccessToken.execute(token) : null;
    if (!session) return next(new Error(UNAUTHORIZED_CONNECTION));
    socket.data = session;
    next();
  }

  private disconnectWhenExpired(socket: RealtimeSocket, expiresAtMs: number): void {
    const timer = setTimeout(() => {
      socket.emit(REALTIME_EVENT.sessionExpired);
      socket.disconnect(true);
    }, Math.max(0, expiresAtMs - Date.now()));
    socket.on('disconnect', () => clearTimeout(timer));
  }

  private disconnectUser(userId: ActorId): void {
    if (!this.server) return;
    this.server.in(userRoom(userId)).disconnectSockets(true);
  }
}

function authenticatedSession(socket: RealtimeSocket) {
  const { userId, expiresAtMs } = socket.data;
  return userId && expiresAtMs ? { userId, expiresAtMs } : null;
}

function userRoom(userId: string): string {
  return `${USER_ROOM_PREFIX}${userId}`;
}

function cookieValue(header: string | undefined, name: string): string | null {
  const prefix = `${name}=`;
  const cookie = header?.split(';').map((part) => part.trim()).find(
    (part) => part.startsWith(prefix),
  );
  return cookie ? cookie.slice(prefix.length) : null;
}
