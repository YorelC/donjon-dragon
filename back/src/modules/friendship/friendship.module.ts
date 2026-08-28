import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ClockModule } from '@kernel/infrastructure/clock.module';
import {
  OUTBOX_MESSAGE_MODEL,
  OutboxMessageSchema,
} from '@kernel/infrastructure/outbox-message.schema';
import { UserModule } from '@modules/user/user.module';
import { FRIEND_DIRECTORY } from './application/ports/friend-directory.port';
import { FRIENDSHIP_REPOSITORY } from './application/ports/friendship.repository.port';
import { AreFriendsUseCase } from './application/use-cases/are-friends.use-case';
import { SendFriendRequestUseCase } from './application/use-cases/send-friend-request.use-case';
import { AcceptFriendRequestUseCase } from './application/use-cases/accept-friend-request.use-case';
import { RefuseFriendRequestUseCase } from './application/use-cases/refuse-friend-request.use-case';
import { ListFriendsUseCase } from './application/use-cases/list-friends.use-case';
import { ListPendingReceivedUseCase } from './application/use-cases/list-pending-received.use-case';
import { ListPendingSentUseCase } from './application/use-cases/list-pending-sent.use-case';
import { RemoveFriendUseCase } from './application/use-cases/remove-friend.use-case';
import { SearchUsersUseCase } from './application/use-cases/search-users.use-case';
import { CountPendingReceivedUseCase } from './application/use-cases/count-pending-received.use-case';
import {
  FRIENDSHIP_MODEL,
  FriendshipSchema,
} from './infrastructure/persistence/friendship.schema';
import { UserFriendDirectory } from './infrastructure/acl/user-friend-directory';
import { MongoFriendshipRepository } from './infrastructure/persistence/mongo-friendship.repository';
import { FriendshipController } from './presentation/friendship.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FRIENDSHIP_MODEL, schema: FriendshipSchema },
      { name: OUTBOX_MESSAGE_MODEL, schema: OutboxMessageSchema },
    ]),
    UserModule,
    ClockModule,
  ],
  controllers: [FriendshipController],
  providers: [
    { provide: FRIENDSHIP_REPOSITORY, useClass: MongoFriendshipRepository },
    // Anti-corruption layer : le seul provider qui traverse vers le module user.
    { provide: FRIEND_DIRECTORY, useClass: UserFriendDirectory },
    AreFriendsUseCase,
    SendFriendRequestUseCase,
    AcceptFriendRequestUseCase,
    RefuseFriendRequestUseCase,
    ListFriendsUseCase,
    ListPendingReceivedUseCase,
    ListPendingSentUseCase,
    RemoveFriendUseCase,
    SearchUsersUseCase,
    CountPendingReceivedUseCase,
  ],
  // Seul `AreFriendsUseCase` sort : c'est ce dont `campaigns` a besoin pour
  // n'autoriser l'invitation qu'entre amis. FRIENDSHIP_REPOSITORY reste privé —
  // avec lui en main, un voisin écrirait dans l'agrégat sans ses invariants.
  exports: [AreFriendsUseCase],
})
export class FriendshipModule {}
