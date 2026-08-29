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
  CAMPAIGN_AUDIENCE,
  type CampaignAudiencePort,
} from '../application/ports/campaign-audience.port';
import {
  REALTIME_NOTIFIER,
  type RealtimeNotifierPort,
} from '../application/ports/realtime-notifier.port';

const POLL_INTERVAL_MS = 500;
const LEASE_DURATION_MS = 30_000;
const MAX_MESSAGES_PER_POLL = 20;


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
 * Le routage n'a besoin que de l'identité du message et du fait. Les
 * destinataires n'en font PAS partie : une audience de campagne les laisse vides
 * dans l'enveloppe et les fait relire à l'émission. C'est le résolveur, pas le
 * schéma, qui garantit qu'on ne diffuse jamais vers personne.
 */
const DeliverableMessageSchema = z.object({
  _id: z.string().uuid(),
  factType: z.string().min(1),
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
    @Inject(CAMPAIGN_AUDIENCE) private readonly campaigns: CampaignAudiencePort,
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

    const recipients = await this.recipientsOf(message);
    if (recipients.length === 0) {
      return this.quarantine(message._id, 'audience vide ou non résolvable');
    }

    this.notifier.notifyUsers(
      recipients,
      RealtimeResourceChangedSchema.parse({ messageId: parsed.data._id, resource }),
    );
    await this.updateStatus(message._id, OUTBOX_STATUS.delivered);
  }

  /**
   * Une audience portée par l'enveloppe se lit ; une audience de campagne se
   * RELIT depuis la campagne, à l'instant de l'émission. C'est ce qui retire un
   * membre exclu de la diffusion suivante, même si sa socket est encore ouverte.
   *
   * Table fermée : une politique absente ne diffuse rien.
   */
  private recipientsOf(message: OutboxMessageDocument): Promise<readonly string[]> {
    const resolve = this.audienceResolvers()[message.audiencePolicy];
    return resolve ? resolve(message) : Promise.resolve([]);
  }

  private audienceResolvers(): Record<
    string,
    (message: OutboxMessageDocument) => Promise<readonly string[]>
  > {
    return {
      [OUTBOX_AUDIENCE_POLICY.targetUser]: carriedByEnvelope,
      [OUTBOX_AUDIENCE_POLICY.friendshipParticipants]: carriedByEnvelope,
      [OUTBOX_AUDIENCE_POLICY.campaignMembers]: (message) =>
        this.readCampaign(message, (id) => this.campaigns.activeMemberIds(id)),
      [OUTBOX_AUDIENCE_POLICY.campaignGameMasters]: (message) =>
        this.readCampaign(message, (id) => this.campaigns.activeGameMasterIds(id)),
    };
  }

  /** Une politique de campagne sans `campaignId` est une enveloppe incohérente. */
  private async readCampaign(
    message: OutboxMessageDocument,
    read: (campaignId: string) => Promise<readonly string[]>,
  ): Promise<readonly string[]> {
    return message.campaignId ? read(message.campaignId) : [];
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

/**
 * Toutes les politiques d'audience sont désormais résolvables : le filtre ne
 * trie plus que sur le canal. Le canal `email` reste hors du relais temps réel.
 */
function claimableFilter(now: Date) {
  return {
    deliveryChannel: OUTBOX_DELIVERY_CHANNEL.realtime,
    $or: [
      { status: OUTBOX_STATUS.pending, availableAt: { $lte: now } },
      { status: OUTBOX_STATUS.processing, leaseUntil: { $lte: now } },
    ],
  };
}

/** Les deux audiences dont les destinataires sont immuables et écrits au commit. */
function carriedByEnvelope(
  message: OutboxMessageDocument,
): Promise<readonly string[]> {
  return Promise.resolve(message.audienceUserIds);
}
