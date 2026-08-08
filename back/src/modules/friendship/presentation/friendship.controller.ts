import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Inject,
} from '@nestjs/common';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';

import { throwAsHttpException } from './friendship-error.mapper';
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
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('api/friends')
@UseGuards(JwtAuthGuard)
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
    @CurrentUser() user: TokenPayload,
    @Param('displayName') displayName: string,
  ) {
    try {
      return await this.sendFriendRequestUseCase.execute({
        requesterId: user.userId,
        displayName,
      });
    } catch (err) {
      throwAsHttpException(err);
    }
  }

  @Post('accept/:friendshipId')
  async acceptFriendRequest(
    @CurrentUser() user: TokenPayload,
    @Param('friendshipId') friendshipId: string,
  ) {
    try {
      return await this.acceptFriendRequestUseCase.execute({
        friendshipId,
        actingUserId: user.userId,
      });
    } catch (err) {
      throwAsHttpException(err);
    }
  }

  @Post('refuse/:friendshipId')
  async refuseFriendRequest(
    @CurrentUser() user: TokenPayload,
    @Param('friendshipId') friendshipId: string,
  ) {
    try {
      return await this.refuseFriendRequestUseCase.execute({
        friendshipId,
        actingUserId: user.userId,
      });
    } catch (err) {
      throwAsHttpException(err);
    }
  }

  @Get('search')
  async searchUsers(
    @CurrentUser() user: TokenPayload,
    @Query('q') q: string,
  ) {
    return this.searchUsersUseCase.execute({
      userId: user.userId,
      query: q,
    });
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

  @Delete(':friendshipId')
  async removeFriend(
    @CurrentUser() user: TokenPayload,
    @Param('friendshipId') friendshipId: string,
  ) {
    try {
      await this.removeFriendUseCase.execute({
        userId: user.userId,
        friendshipId,
      });
    } catch (err) {
      throwAsHttpException(err);
    }
  }
}
