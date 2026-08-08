import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, type TestingModule } from '@nestjs/testing';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';
import { FriendshipController } from './friendship.controller';
import { SendFriendRequestUseCase } from '../application/use-cases/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from '../application/use-cases/accept-friend-request.use-case';
import { RefuseFriendRequestUseCase } from '../application/use-cases/refuse-friend-request.use-case';
import { ListFriendsUseCase } from '../application/use-cases/list-friends.use-case';
import { ListPendingReceivedUseCase } from '../application/use-cases/list-pending-received.use-case';
import { ListPendingSentUseCase } from '../application/use-cases/list-pending-sent.use-case';
import { RemoveFriendUseCase } from '../application/use-cases/remove-friend.use-case';
import { SearchUsersUseCase } from '../application/use-cases/search-users.use-case';
import { CountPendingReceivedUseCase } from '../application/use-cases/count-pending-received.use-case';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';

const mockUseCase = (): { execute: ReturnType<typeof vi.fn> } => ({
  execute: vi.fn(),
});

const user = (userId: string): TokenPayload => ({
  userId,
  role: 'player',
  tier: 'full',
});

describe('FriendshipController — countPendingReceived', () => {
  let controller: FriendshipController;
  let countPendingReceived: CountPendingReceivedUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FriendshipController],
      providers: [
        { provide: SendFriendRequestUseCase, useValue: mockUseCase() },
        { provide: AcceptFriendRequestUseCase, useValue: mockUseCase() },
        { provide: RefuseFriendRequestUseCase, useValue: mockUseCase() },
        { provide: ListFriendsUseCase, useValue: mockUseCase() },
        { provide: ListPendingReceivedUseCase, useValue: mockUseCase() },
        { provide: ListPendingSentUseCase, useValue: mockUseCase() },
        { provide: RemoveFriendUseCase, useValue: mockUseCase() },
        { provide: SearchUsersUseCase, useValue: mockUseCase() },
        { provide: CountPendingReceivedUseCase, useValue: mockUseCase() },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: vi.fn(() => true) })
      .compile();

    controller = module.get<FriendshipController>(FriendshipController);
    countPendingReceived = module.get<CountPendingReceivedUseCase>(CountPendingReceivedUseCase);
  });

  it('UA-008: GET /api/friends/requests/incoming/count renvoie { count } avec le userId courant', async () => {
    const mockUser = user('550e8400-e29b-41d4-a716-446655440000');
    vi.mocked(countPendingReceived.execute).mockResolvedValue({ count: 5 });

    const result = await controller.countPendingReceived(mockUser);

    expect(result).toEqual({ count: 5 });
    expect(countPendingReceived.execute).toHaveBeenCalledWith({ userId: mockUser.userId });
  });

  it('retourne { count: 0 } quand il n\'y a aucune demande', async () => {
    const mockUser = user('550e8400-e29b-41d4-a716-446655440001');
    vi.mocked(countPendingReceived.execute).mockResolvedValue({ count: 0 });

    const result = await controller.countPendingReceived(mockUser);

    expect(result).toEqual({ count: 0 });
    expect(countPendingReceived.execute).toHaveBeenCalledWith({ userId: mockUser.userId });
  });

  it('retourne un grand nombre sans erreur', async () => {
    const mockUser = user('550e8400-e29b-41d4-a716-446655440002');
    vi.mocked(countPendingReceived.execute).mockResolvedValue({ count: 999 });

    const result = await controller.countPendingReceived(mockUser);

    expect(result).toEqual({ count: 999 });
  });

  it('passe le bon userId meme avec un UUID différent', async () => {
    const mockUser = user('660e8400-e29b-41d4-a716-446655440000');
    vi.mocked(countPendingReceived.execute).mockResolvedValue({ count: 3 });

    await controller.countPendingReceived(mockUser);

    expect(countPendingReceived.execute).toHaveBeenCalledWith({ userId: '660e8400-e29b-41d4-a716-446655440000' });
  });
});

describe('FriendshipController — JwtAuthGuard', () => {
  it('applique JwtAuthGuard sur le controller (toutes les routes)', () => {
    const guards = Reflect.getMetadata('__guards__', FriendshipController);
    expect(guards).toBeDefined();
    const hasJwtGuard = guards.some(
      (guard: new (...args: never[]) => unknown) => guard === JwtAuthGuard,
    );
    expect(hasJwtGuard).toBe(true);
  });
});