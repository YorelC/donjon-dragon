import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendshipSchema } from '../04-infrastructure/friendship.schema';
import { MongoFriendshipRepository } from '../04-infrastructure/mongo-friendship.repository';
import { SendFriendRequestUseCase } from '../02-application/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from '../02-application/accept-friend-request.use-case';
import { RefuseFriendRequestUseCase } from '../02-application/refuse-friend-request.use-case';
import { ListFriendsUseCase } from '../02-application/list-friends.use-case';
import { ListPendingReceivedUseCase } from '../02-application/list-pending-received.use-case';
import { ListPendingSentUseCase } from '../02-application/list-pending-sent.use-case';
import { RemoveFriendUseCase } from '../02-application/remove-friend.use-case';
import { SearchUsersUseCase } from '../02-application/search-users.use-case';
import { FriendshipController } from './friendship.controller';
import { UserModule } from '../../user/01-interface/user.module';
import { AuthGuardsModule } from '../../auth/01-interface/auth-guards.module';
import type { FriendshipRepositoryPort } from '../03-domain/friendship.repository.port';

const FRIENDSHIP_REPOSITORY = 'FRIENDSHIP_REPOSITORY';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Friendship', schema: FriendshipSchema }]),
    UserModule,
    AuthGuardsModule,
  ],
  providers: [
    {
      provide: FRIENDSHIP_REPOSITORY,
      useFactory: (model) => new MongoFriendshipRepository(model),
      inject: ['FriendshipModel'],
    },
    {
      provide: SendFriendRequestUseCase,
      useFactory: (friendshipRepo: FriendshipRepositoryPort, userRepo) => {
        return new SendFriendRequestUseCase(userRepo, friendshipRepo);
      },
      inject: [FRIENDSHIP_REPOSITORY, 'USER_REPOSITORY'],
    },
    {
      provide: AcceptFriendRequestUseCase,
      useFactory: (friendshipRepo: FriendshipRepositoryPort) => {
        return new AcceptFriendRequestUseCase(friendshipRepo);
      },
      inject: [FRIENDSHIP_REPOSITORY],
    },
    {
      provide: RefuseFriendRequestUseCase,
      useFactory: (friendshipRepo: FriendshipRepositoryPort) => {
        return new RefuseFriendRequestUseCase(friendshipRepo);
      },
      inject: [FRIENDSHIP_REPOSITORY],
    },
    {
      provide: ListFriendsUseCase,
      useFactory: (friendshipRepo: FriendshipRepositoryPort, userRepo) => {
        return new ListFriendsUseCase(friendshipRepo, userRepo);
      },
      inject: [FRIENDSHIP_REPOSITORY, 'USER_REPOSITORY'],
    },
    {
      provide: ListPendingReceivedUseCase,
      useFactory: (friendshipRepo: FriendshipRepositoryPort, userRepo) => {
        return new ListPendingReceivedUseCase(friendshipRepo, userRepo);
      },
      inject: [FRIENDSHIP_REPOSITORY, 'USER_REPOSITORY'],
    },
    {
      provide: ListPendingSentUseCase,
      useFactory: (friendshipRepo: FriendshipRepositoryPort, userRepo) => {
        return new ListPendingSentUseCase(friendshipRepo, userRepo);
      },
      inject: [FRIENDSHIP_REPOSITORY, 'USER_REPOSITORY'],
    },
    {
      provide: RemoveFriendUseCase,
      useFactory: (friendshipRepo: FriendshipRepositoryPort) => {
        return new RemoveFriendUseCase(friendshipRepo);
      },
      inject: [FRIENDSHIP_REPOSITORY],
    },
    {
      provide: SearchUsersUseCase,
      useFactory: (userRepo) => {
        return new SearchUsersUseCase(userRepo);
      },
      inject: ['USER_REPOSITORY'],
    },
  ],
  controllers: [FriendshipController],
})
export class FriendshipModule {}
