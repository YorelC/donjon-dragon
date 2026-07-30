import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import type { SendFriendRequestDto } from '@donjon-dragon/shared/friendship-schema';
import type { TokenPayload } from '@donjon-dragon/shared/auth-schema';

import {
  CannotFriendSelfError,
  RecipientNotFoundError,
  FriendshipNotFoundError,
  FriendRequestAlreadyExistsError,
  AlreadyFriendsError,
  FriendRequestNotPendingError,
  NotRequestRecipientError,
  NotFriendshipParticipantError,
} from '../03-domain/friendship.errors';
import { SendFriendRequestUseCase } from '../02-application/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from '../02-application/accept-friend-request.use-case';
import { RefuseFriendRequestUseCase } from '../02-application/refuse-friend-request.use-case';
import { ListFriendsUseCase } from '../02-application/list-friends.use-case';
import { ListPendingReceivedUseCase } from '../02-application/list-pending-received.use-case';
import { ListPendingSentUseCase } from '../02-application/list-pending-sent.use-case';
import { RemoveFriendUseCase } from '../02-application/remove-friend.use-case';
import { JwtAuthGuard } from '../../auth/01-interface/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/01-interface/decorators/current-user.decorator';
import { SearchUsersUseCase } from '../02-application/search-users.use-case';

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
      if (err instanceof CannotFriendSelfError) {
        throw new BadRequestException(err.message);
      }
      if (err instanceof RecipientNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (
        err instanceof FriendRequestAlreadyExistsError ||
        err instanceof AlreadyFriendsError
      ) {
        throw new ConflictException(err.message);
      }
      throw err;
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
      if (err instanceof FriendshipNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (
        err instanceof FriendRequestNotPendingError ||
        err instanceof AlreadyFriendsError
      ) {
        throw new ConflictException(err.message);
      }
      if (err instanceof NotRequestRecipientError) {
        throw new ForbiddenException(err.message);
      }
      throw err;
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
      if (err instanceof FriendshipNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (err instanceof FriendRequestNotPendingError) {
        throw new ConflictException(err.message);
      }
      if (err instanceof NotRequestRecipientError) {
        throw new ForbiddenException(err.message);
      }
      throw err;
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
      if (err instanceof FriendshipNotFoundError) {
        throw new NotFoundException(err.message);
      }
      if (err instanceof NotFriendshipParticipantError) {
        throw new ForbiddenException(err.message);
      }
      throw err;
    }
  }
}
