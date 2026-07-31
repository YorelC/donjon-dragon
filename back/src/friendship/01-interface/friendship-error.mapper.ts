import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  type HttpException,
} from '@nestjs/common';

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

/** Traduit une erreur du domaine amitié en exception HTTP, ou la relaie telle quelle. */
export function throwAsHttpException(err: unknown): never {
  for (const [DomainError, toHttpException] of HTTP_EXCEPTION_BY_DOMAIN_ERROR) {
    if (err instanceof DomainError) {
      throw toHttpException(err.message);
    }
  }
  throw err;
}

type DomainErrorClass = new (...args: never[]) => Error;
type HttpExceptionFactory = (message: string) => HttpException;

const HTTP_EXCEPTION_BY_DOMAIN_ERROR: ReadonlyArray<
  [DomainErrorClass, HttpExceptionFactory]
> = [
  [CannotFriendSelfError, (message) => new BadRequestException(message)],
  [RecipientNotFoundError, (message) => new NotFoundException(message)],
  [FriendshipNotFoundError, (message) => new NotFoundException(message)],
  [FriendRequestAlreadyExistsError, (message) => new ConflictException(message)],
  [AlreadyFriendsError, (message) => new ConflictException(message)],
  [FriendRequestNotPendingError, (message) => new ConflictException(message)],
  [NotRequestRecipientError, (message) => new ForbiddenException(message)],
  [NotFriendshipParticipantError, (message) => new ForbiddenException(message)],
];
