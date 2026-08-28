import { describe, expect, it } from 'vitest';
import {
  REALTIME_RESOURCE,
  RealtimeResourceChangedSchema,
} from './realtime-schema.js';

const MESSAGE_ID = '11111111-1111-4111-8111-111111111111';

describe('RealtimeResourceChangedSchema', () => {
  it('accepte le signal public minimal', () => {
    expect(
      RealtimeResourceChangedSchema.parse({
        messageId: MESSAGE_ID,
        resource: REALTIME_RESOURCE.friendships,
      }),
    ).toEqual({ messageId: MESSAGE_ID, resource: 'friendships' });
  });

  it('refuse une ressource non déclarée', () => {
    expect(() =>
      RealtimeResourceChangedSchema.parse({
        messageId: MESSAGE_ID,
        resource: 'users',
      }),
    ).toThrow();
  });
});
