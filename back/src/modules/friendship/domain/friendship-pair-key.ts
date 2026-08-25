import type { UserId } from '@kernel/domain/user-id';

const PAIR_KEY_SEPARATOR = ':';

export function friendshipPairKey(userAId: UserId, userBId: UserId): string {
  return [userAId.value, userBId.value].sort().join(PAIR_KEY_SEPARATOR);
}
