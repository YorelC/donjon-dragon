import { z } from 'zod';

const REALTIME_RESOURCES = [
  'friendships',
  'campaign-invitations',
  'campaigns',
] as const;

export type RealtimeResource = (typeof REALTIME_RESOURCES)[number];

export const REALTIME_RESOURCE = Object.fromEntries(
  REALTIME_RESOURCES.map((resource) => [resource, resource]),
) as { readonly [R in RealtimeResource]: R };

export const REALTIME_EVENT = {
  resourceChanged: 'resource.changed',
  sessionExpired: 'session.expired',
} as const;

export const RealtimeResourceChangedSchema = z.object({
  messageId: z.string().uuid(),
  resource: z.enum(REALTIME_RESOURCES),
});

export type RealtimeResourceChanged = z.infer<
  typeof RealtimeResourceChangedSchema
>;
