import {
  Controller,
  Post,
  Get,
  Delete,
  Inject,
  HttpCode,
} from '@nestjs/common';
import type { AuthenticatedActor } from '@kernel/domain/actor-id';
import {
  FriendshipIdSchema,
  UserSearchQuerySchema,
  type UserSearchQuery,
} from '@donjon-dragon/shared/friendship-schema';
import { displayNameField } from '@donjon-dragon/shared/user-schema';

import { CurrentUser } from '@common/decorators/current-user.decorator';
import { ZodParam, ZodQuery } from '@common/decorators/zod-validated.decorator';
import { SendFriendRequestUseCase } from '../application/use-cases/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from '../application/use-cases/accept-friend-request.use-case';
import { RefuseFriendRequestUseCase } from '../application/use-cases/refuse-friend-request.use-case';
import { ListFriendsUseCase } from '../application/use-cases/list-friends.use-case';
import { ListPendingReceivedUseCase } from '../application/use-cases/list-pending-received.use-case';
import { ListPendingSentUseCase } from '../application/use-cases/list-pending-sent.use-case';
import { RemoveFriendUseCase } from '../application/use-cases/remove-friend.use-case';
import { SearchUsersUseCase } from '../application/use-cases/search-users.use-case';
import { CountPendingReceivedUseCase } from '../application/use-cases/count-pending-received.use-case';

// Les bornes de la recherche viennent de shared/ : c'est la seule source, partagée
// avec le formulaire du front. `q` absent faisait planter escapeRegex sur
// undefined, donc un 500 sur /api/friends/search sans paramètre — désormais 400.

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

  @Post('request/:displayName')
  async sendFriendRequest(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('displayName', displayNameField()) displayName: string,
  ) {
    return this.sendFriendRequestUseCase.execute({
      requesterId: user.userId,
      displayName,
    });
  }

  @Post('accept/:friendshipId')
  async acceptFriendRequest(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('friendshipId', FriendshipIdSchema) friendshipId: string,
  ) {
    return this.acceptFriendRequestUseCase.execute({
      friendshipId,
      actingUserId: user.userId,
    });
  }

  @Post('refuse/:friendshipId')
  async refuseFriendRequest(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('friendshipId', FriendshipIdSchema) friendshipId: string,
  ) {
    return this.refuseFriendRequestUseCase.execute({
      friendshipId,
      actingUserId: user.userId,
    });
  }

  @Get('search')
  async searchUsers(
    @CurrentUser() user: AuthenticatedActor,
    @ZodQuery(UserSearchQuerySchema) query: UserSearchQuery,
  ) {
    return this.searchUsersUseCase.execute({
      userId: user.userId,
      query: query.q,
      page: query.page,
    });
  }

  @Get()
  async listFriends(@CurrentUser() user: AuthenticatedActor) {
    return this.listFriendsUseCase.execute({ userId: user.userId });
  }

  @Get('requests/incoming/count')
  async countPendingReceived(@CurrentUser() user: AuthenticatedActor) {
    return this.countPendingReceivedUseCase.execute({ userId: user.userId });
  }

  @Get('requests/incoming')
  async listPendingReceived(@CurrentUser() user: AuthenticatedActor) {
    return this.listPendingReceivedUseCase.execute({ userId: user.userId });
  }

  @Get('requests/outgoing')
  async listPendingSent(@CurrentUser() user: AuthenticatedActor) {
    return this.listPendingSentUseCase.execute({ userId: user.userId });
  }

  @HttpCode(204)
  @Delete(':friendshipId')
  async removeFriend(
    @CurrentUser() user: AuthenticatedActor,
    @ZodParam('friendshipId', FriendshipIdSchema) friendshipId: string,
  ) {
    await this.removeFriendUseCase.execute({ userId: user.userId, friendshipId });
  }
}
