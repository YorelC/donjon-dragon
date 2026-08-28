import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ClockModule } from '@kernel/infrastructure/clock.module';
import { SessionRevocationModule } from '@kernel/infrastructure/session-revocation.module';
import {
  OUTBOX_MESSAGE_MODEL,
  OutboxMessageSchema,
} from '@kernel/infrastructure/outbox-message.schema';
import { AuthModule } from '@modules/auth/auth.module';
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
  providers: [RealtimeGateway, RealtimeOutboxRelay],
})
export class RealtimeModule {}
