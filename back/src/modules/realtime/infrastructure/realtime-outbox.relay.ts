import {
  Inject,
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { z } from 'zod';
import {
  REALTIME_RESOURCE,
  RealtimeResourceChangedSchema,
} from '@donjon-dragon/shared/realtime-schema';
import { CLOCK, type Clock } from '@kernel/application/clock.port';
import {
  OUTBOX_AUDIENCE_POLICY,
  OUTBOX_DELIVERY_CHANNEL,
  OUTBOX_STATUS,
} from '@kernel/infrastructure/outbox-message.contract';
import {
  OUTBOX_MESSAGE_MODEL,
  type OutboxMessageDocument,
} from '@kernel/infrastructure/outbox-message.schema';
import { RealtimeGateway } from '../presentation/realtime.gateway';

const OWNER_MODULE = 'friendship';
const POLL_INTERVAL_MS = 500;
const LEASE_DURATION_MS = 30_000;
const MAX_MESSAGES_PER_POLL = 20;
const FriendshipMessageSchema = z.object({
  _id: z.string().uuid(),
  audiencePolicy: z.literal(OUTBOX_AUDIENCE_POLICY.friendshipParticipants),
  audienceUserIds: z.array(z.string().uuid()).length(2),
});

@Injectable()
export class RealtimeOutboxRelay
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private timer?: ReturnType<typeof setInterval>;
  private polling = false;

  constructor(
    @InjectModel(OUTBOX_MESSAGE_MODEL)
    private readonly outbox: Model<OutboxMessageDocument>,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly gateway: RealtimeGateway,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
    void this.poll();
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async drainOnce(): Promise<boolean> {
    const message = await this.claimOne();
    if (!message) return false;
    await this.deliver(message);
    return true;
  }

  private async poll(): Promise<void> {
    if (this.polling) return;
    this.polling = true;
    try {
      await this.drainBatch(MAX_MESSAGES_PER_POLL);
    } catch {
      return;
    } finally {
      this.polling = false;
    }
  }

  private async drainBatch(remaining: number): Promise<void> {
    if (remaining === 0) return;
    if (!(await this.drainOnce())) return;
    await this.drainBatch(remaining - 1);
  }

  private async claimOne(): Promise<OutboxMessageDocument | null> {
    const now = this.clock.now();
    return this.outbox.findOneAndUpdate(
      claimableFilter(now),
      {
        $set: {
          status: OUTBOX_STATUS.processing,
          leaseUntil: new Date(now.getTime() + LEASE_DURATION_MS),
          updatedAt: now,
        },
      },
      { sort: { availableAt: 1 }, new: true },
    ).lean<OutboxMessageDocument>();
  }

  private async deliver(message: OutboxMessageDocument): Promise<void> {
    const parsed = FriendshipMessageSchema.safeParse(message);
    if (!parsed.success) return this.markQuarantined(message._id);
    const payload = RealtimeResourceChangedSchema.parse({
      messageId: parsed.data._id,
      resource: REALTIME_RESOURCE.friendships,
    });
    this.gateway.notifyUsers(parsed.data.audienceUserIds, payload);
    await this.markDelivered(message._id);
  }

  private async markDelivered(messageId: string): Promise<void> {
    await this.updateStatus(messageId, OUTBOX_STATUS.delivered);
  }

  private async markQuarantined(messageId: string): Promise<void> {
    await this.updateStatus(messageId, OUTBOX_STATUS.quarantined);
  }

  private async updateStatus(
    messageId: string,
    status: OutboxMessageDocument['status'],
  ): Promise<void> {
    await this.outbox.updateOne(
      { _id: messageId, status: OUTBOX_STATUS.processing },
      { $set: { status, leaseUntil: null, updatedAt: this.clock.now() } },
    );
  }
}

function claimableFilter(now: Date) {
  return {
    ownerModule: OWNER_MODULE,
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    $or: [
      { status: OUTBOX_STATUS.pending, availableAt: { $lte: now } },
      { status: OUTBOX_STATUS.processing, leaseUntil: { $lte: now } },
    ],
  };
}
