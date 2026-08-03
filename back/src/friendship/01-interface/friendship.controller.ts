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
import { SendFriendRequestUseCase } from '../02-application/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from '../02-application/accept-friend-request.use-case';
import { RefuseFriendRequestUseCase } from '../02-application/refuse-friend-request.use-case';
import { ListFriendsUseCase } from '../02-application/list-friends.use-case';
import { ListPendingReceivedUseCase } from '../02-application/list-pending-received.use-case';
import { ListPendingSentUseCase } from '../02-application/list-pending-sent.use-case';
import { RemoveFriendUseCase } from '../02-application/remove-friend.use-case';
import { SearchUsersUseCase } from '../02-application/search-users.use-case';
import { CountPendingReceivedUseCase } from '../02-application/count-pending-received.use-case';
import { JwtAuthGuard } from '../../auth/01-interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/01-interface/decorators/current-user.decorator';

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
