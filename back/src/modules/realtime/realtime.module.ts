import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClockModule } from '@kernel/infrastructure/clock.module';
import { SessionRevocationModule } from '@kernel/infrastructure/session-revocation.module';
import {
  OUTBOX_MESSAGE_MODEL,
  OutboxMessageSchema,
} from '@kernel/infrastructure/outbox-message.schema';
import { AuthModule } from '@modules/auth/auth.module';
import { CampaignsModule } from '@modules/campaigns/campaigns.module';
import { CAMPAIGN_AUDIENCE } from './application/ports/campaign-audience.port';
import { REALTIME_NOTIFIER } from './application/ports/realtime-notifier.port';
import { CampaignRealtimeAudience } from './infrastructure/acl/campaign-realtime-audience';
import { RealtimeOutboxRelay } from './infrastructure/realtime-outbox.relay';
import { RealtimeGateway } from './presentation/realtime.gateway';

@Module({
  imports: [
    AuthModule,
    CampaignsModule,
    ClockModule,
    SessionRevocationModule,
    MongooseModule.forFeature([
      { name: OUTBOX_MESSAGE_MODEL, schema: OutboxMessageSchema },
    ]),
  ],
  providers: [
    RealtimeGateway,
    // La gateway EST l'adapter sortant, mais le relais ne la connaît que par son
    // port : l'infrastructure n'a pas à importer la présentation.
    { provide: REALTIME_NOTIFIER, useExisting: RealtimeGateway },
    // Le seul provider qui traverse vers un module voisin : la 5D veut les
    // adhesions relues a chaque emission, elles vivent chez campaigns.
    { provide: CAMPAIGN_AUDIENCE, useClass: CampaignRealtimeAudience },
    RealtimeOutboxRelay,
  ],
})
export class RealtimeModule {}
