import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendshipSchema } from './infrastructure/persistence/friendship.schema';
import { MongoFriendshipRepository } from './infrastructure/persistence/mongo-friendship.repository';
import { SendFriendRequestUseCase } from './application/use-cases/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from './application/use-cases/accept-friend-request.use-case';
import { RefuseFriendRequestUseCase } from './application/use-cases/refuse-friend-request.use-case';
import { ListFriendsUseCase } from './application/use-cases/list-friends.use-case';
import { ListPendingReceivedUseCase } from './application/use-cases/list-pending-received.use-case';
import { ListPendingSentUseCase } from './application/use-cases/list-pending-sent.use-case';
import { RemoveFriendUseCase } from './application/use-cases/remove-friend.use-case';
import { SearchUsersUseCase } from './application/use-cases/search-users.use-case';
import { CountPendingReceivedUseCase } from './application/use-cases/count-pending-received.use-case';
import { FriendshipController } from './presentation/friendship.controller';
import { UserModule } from '@modules/user/user.module';
import { AuthGuardsModule } from '@modules/auth/auth-guards.module';
import type { FriendshipRepositoryPort } from './application/ports/friendship.repository.port';

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
    {
      provide: CountPendingReceivedUseCase,
      useFactory: (friendshipRepo: FriendshipRepositoryPort) => {
        return new CountPendingReceivedUseCase(friendshipRepo);
      },
      inject: [FRIENDSHIP_REPOSITORY],
    },
  ],
  controllers: [FriendshipController],
})
export class FriendshipModule {}
