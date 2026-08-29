import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { z } from 'zod';
import {
  REALTIME_RESOURCE,
  RealtimeResourceChangedSchema,
  type RealtimeResource,
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
import {
  REALTIME_NOTIFIER,
  type RealtimeNotifierPort,
} from '../application/ports/realtime-notifier.port';

const POLL_INTERVAL_MS = 500;
const LEASE_DURATION_MS = 30_000;
const MAX_MESSAGES_PER_POLL = 20;

/**
 * Les audiences dont les destinataires sont écrits dans le message.
 *
 * `campaign-members` et `campaign-game-masters` en sont volontairement absentes :
 * les résoudre demande une lecture d'adhésion que la 5D n'a pas spécifiée. Leurs
 * messages restent donc `pending` — non livrés, mais pas perdus, et ils repartiront
 * le jour où un résolveur d'audience de campagne existera.
 */
const RESOLVABLE_AUDIENCES = [
  OUTBOX_AUDIENCE_POLICY.friendshipParticipants,
  OUTBOX_AUDIENCE_POLICY.targetUser,
];

/**
 * Ce que le client doit réinvalider pour chaque fait. Table fermée : un fait absent
 * ne se diffuse pas, il part en quarantaine. Une faute de frappe ne doit jamais
 * pouvoir déclencher une diffusion par défaut.
 */
const RESOURCE_BY_FACT: Record<string, RealtimeResource> = {
  'friendship.requested': REALTIME_RESOURCE.friendships,
  'friendship.accepted': REALTIME_RESOURCE.friendships,
  'friendship.refused': REALTIME_RESOURCE.friendships,
  'friendship.removed': REALTIME_RESOURCE.friendships,
  'campaign.invitation.created': REALTIME_RESOURCE['campaign-invitations'],
  'campaign.invitation.cancelled': REALTIME_RESOURCE['campaign-invitations'],
};

/**
 * Le routage n'a besoin que de l'identité du message, du fait et des destinataires.
 * La cardinalité de l'audience est déjà tenue à l'écriture par la fabrique du
 * kernel : le relais ne rejoue pas une règle qui n'est pas la sienne.
 */
const DeliverableMessageSchema = z.object({
  _id: z.string().uuid(),
  factType: z.string().min(1),
  audienceUserIds: z.array(z.string().uuid()).min(1),
});

@Injectable()
export class RealtimeOutboxRelay
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(RealtimeOutboxRelay.name);
  private timer?: ReturnType<typeof setInterval>;
  /**
   * Le poll en cours, et non un drapeau : un booléen dit qu'on draine, il ne
   * permet pas d'attendre la fin du drainage. L'arrêt en a besoin.
   */
  private activePoll: Promise<void> | null = null;

  constructor(
    @InjectModel(OUTBOX_MESSAGE_MODEL)
    private readonly outbox: Model<OutboxMessageDocument>,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(REALTIME_NOTIFIER) private readonly notifier: RealtimeNotifierPort,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
    void this.poll();
  }

  /**
   * `onModuleDestroy` et non `onApplicationShutdown` : le second s'exécute APRÈS
   * la fermeture des connexions. Un poll encore en vol y écrirait dans une
   * connexion Mongo déjà fermée, et le message réclamé resterait `processing`
   * jusqu'à expiration de son bail.
   */
  async onModuleDestroy(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.activePoll;
  }

  async drainOnce(): Promise<boolean> {
    const message = await this.claimOne();
    if (!message) return false;
    await this.deliver(message);
    return true;
  }

  private poll(): Promise<void> {
    if (this.activePoll) return this.activePoll;
    this.activePoll = this.drainSafely().finally(() => {
      this.activePoll = null;
    });
    return this.activePoll;
  }

  private async drainSafely(): Promise<void> {
    try {
      await this.drainBatch(MAX_MESSAGES_PER_POLL);
    } catch (error: unknown) {
      // Sans cette trace, une panne de drainage n'a qu'un symptôme : « l'interface
      // ne se met plus à jour ».
      this.logger.error("Drainage de l'outbox temps réel interrompu", error);
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
    const parsed = DeliverableMessageSchema.safeParse(message);
    if (!parsed.success) {
      return this.quarantine(message._id, 'enveloppe illisible');
    }

    const resource = RESOURCE_BY_FACT[parsed.data.factType];
    if (!resource) {
      return this.quarantine(message._id, `fait inconnu ${parsed.data.factType}`);
    }

    this.notifier.notifyUsers(
      parsed.data.audienceUserIds,
      RealtimeResourceChangedSchema.parse({ messageId: parsed.data._id, resource }),
    );
    await this.updateStatus(message._id, OUTBOX_STATUS.delivered);
  }

  private async quarantine(messageId: string, reason: string): Promise<void> {
    this.logger.error(`Message ${messageId} non diffusé : ${reason}`);
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
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    audiencePolicy: { $in: RESOLVABLE_AUDIENCES },
    $or: [
      { status: OUTBOX_STATUS.pending, availableAt: { $lte: now } },
      { status: OUTBOX_STATUS.processing, leaseUntil: { $lte: now } },
    ],
  };
}
