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
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

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
    }).compile();

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

// Le JwtAuthGuard est monté en APP_GUARD : la protection ne s'assert plus par
// la présence d'un @UseGuards, mais par l'ABSENCE de @Public(). C'est
// l'invariant qui compte maintenant — un @Public() posé par erreur ici
// ouvrirait la route au monde.
describe('FriendshipController — protection des routes', () => {
  const ROUTES = [
    'sendFriendRequest',
    'acceptFriendRequest',
    'refuseFriendRequest',
    'searchUsers',
    'listFriends',
    'countPendingReceived',
    'listPendingReceived',
    'listPendingSent',
    'removeFriend',
  ] as const;

  it('ne déclare pas @Public() au niveau du controller', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, FriendshipController)).toBeUndefined();
  });

  it.each(ROUTES)('ne déclare pas @Public() sur %s', (route) => {
    const handler = FriendshipController.prototype[route];
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBeUndefined();
  });

  it('couvre bien toutes les routes du controller', () => {
    const handlers = Object.getOwnPropertyNames(FriendshipController.prototype).filter(
      (name) => name !== 'constructor',
    );
    expect(handlers.sort()).toEqual([...ROUTES].sort());
  });
});