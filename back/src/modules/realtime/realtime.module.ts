import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClockModule } from '@kernel/infrastructure/clock.module';
import { SessionRevocationModule } from '@kernel/infrastructure/session-revocation.module';
import {
  OUTBOX_MESSAGE_MODEL,
  OutboxMessageSchema,
} from '@kernel/infrastructure/outbox-message.schema';
import { AuthModule } from '@modules/auth/auth.module';
import { REALTIME_NOTIFIER } from './application/ports/realtime-notifier.port';
import { RealtimeOutboxRelay } from './infrastructure/realtime-outbox.relay';
import { RealtimeGateway } from './presentation/realtime.gateway';

@Module({
  imports: [
    AuthModule,
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
    RealtimeOutboxRelay,
  ],
})
export class RealtimeModule {}
