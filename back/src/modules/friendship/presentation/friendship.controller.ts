import { Controller, Post, Get, Delete, Param, Inject } from '@nestjs/common';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';
import { z } from 'zod';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodQuery } from '@common/decorators/zod-validated.decorator';
import { RequireTier } from '@common/guards/tier.guard';
import { SendFriendRequestUseCase } from '../application/use-cases/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from '../application/use-cases/accept-friend-request.use-case';
import { RefuseFriendRequestUseCase } from '../application/use-cases/refuse-friend-request.use-case';
import { ListFriendsUseCase } from '../application/use-cases/list-friends.use-case';
import { ListPendingReceivedUseCase } from '../application/use-cases/list-pending-received.use-case';
import { ListPendingSentUseCase } from '../application/use-cases/list-pending-sent.use-case';
import { RemoveFriendUseCase } from '../application/use-cases/remove-friend.use-case';
import { SearchUsersUseCase } from '../application/use-cases/search-users.use-case';
import { CountPendingReceivedUseCase } from '../application/use-cases/count-pending-received.use-case';

// Déclaré avant la classe : un argument de décorateur est évalué au moment de
// la définition de celle-ci. `q` absent faisait planter escapeRegex sur
// undefined, donc un 500 sur /api/friends/search sans paramètre — désormais 400.
const SearchQuerySchema = z.object({ q: z.string().min(1).max(64) });

type SearchQuery = z.infer<typeof SearchQuerySchema>;

/**
 * Traduction HTTP seule. Les erreurs métier remontent telles quelles : le
 * DomainExceptionFilter (APP_FILTER) les convertit en statut.
 * Aucun @UseGuards : le JwtAuthGuard est monté en APP_GUARD dans app.module.
 */
@Controller('friends')
export class FriendshipController {
  constructor(
    @Inject(SendFriendRequestUseCase)
    private sendFriendRequestUseCase: SendFriendRequestUseCase,
    @Inject(AcceptFriendRequestUseCase)
    private acceptFriendRequestUseCase: AcceptFriendRequestUseCase,
    @Inject(RefuseFriendRequestUseCase)
    private refuseFriendRequestUseCase: RefuseFriendRequestUseCase,
    @Inject(ListFriendsUseCase)
    private listFriendsUseCase: ListFriendsUseCase,
    @Inject(ListPendingReceivedUseCase)
    private listPendingReceivedUseCase: ListPendingReceivedUseCase,
    @Inject(ListPendingSentUseCase)
    private listPendingSentUseCase: ListPendingSentUseCase,
    @Inject(RemoveFriendUseCase)
    private removeFriendUseCase: RemoveFriendUseCase,
    @Inject(SearchUsersUseCase)
    private searchUsersUseCase: SearchUsersUseCase,
    @Inject(CountPendingReceivedUseCase)
    private countPendingReceivedUseCase: CountPendingReceivedUseCase,
  ) {}

  @RequireTier('full')
  @Post('request/:displayName')
  async sendFriendRequest(
    @CurrentUser() user: TokenPayload,
    @Param('displayName') displayName: string,
  ) {
    return this.sendFriendRequestUseCase.execute({
      requesterId: user.userId,
      displayName,
    });
  }

  @RequireTier('full')
  @Post('accept/:friendshipId')
  async acceptFriendRequest(
    @CurrentUser() user: TokenPayload,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.acceptFriendRequestUseCase.execute({
      friendshipId,
      actingUserId: user.userId,
    });
  }

  @RequireTier('full')
  @Post('refuse/:friendshipId')
  async refuseFriendRequest(
    @CurrentUser() user: TokenPayload,
    @Param('friendshipId') friendshipId: string,
  ) {
    return this.refuseFriendRequestUseCase.execute({
      friendshipId,
      actingUserId: user.userId,
    });
  }

  @Get('search')
  async searchUsers(
    @CurrentUser() user: TokenPayload,
    @ZodQuery(SearchQuerySchema) query: SearchQuery,
  ) {
    return this.searchUsersUseCase.execute({ userId: user.userId, query: query.q });
  }

  @Get()
  async listFriends(@CurrentUser() user: TokenPayload) {
    return this.listFriendsUseCase.execute({ userId: user.userId });
  }

  @Get('requests/incoming/count')
  async countPendingReceived(@CurrentUser() user: TokenPayload) {
    return this.countPendingReceivedUseCase.execute({ userId: user.userId });
  }

  @Get('requests/incoming')
  async listPendingReceived(@CurrentUser() user: TokenPayload) {
    return this.listPendingReceivedUseCase.execute({ userId: user.userId });
  }

  @Get('requests/outgoing')
  async listPendingSent(@CurrentUser() user: TokenPayload) {
    return this.listPendingSentUseCase.execute({ userId: user.userId });
  }

  @RequireTier('full')
  @Delete(':friendshipId')
  async removeFriend(
    @CurrentUser() user: TokenPayload,
    @Param('friendshipId') friendshipId: string,
  ) {
    await this.removeFriendUseCase.execute({ userId: user.userId, friendshipId });
  }
}
