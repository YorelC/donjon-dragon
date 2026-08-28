import { Module } from '@nestjs/common';
import {
  SESSION_REVOCATION_PUBLISHER,
  SESSION_REVOCATION_SUBSCRIBER,
} from '@kernel/application/session-revocation.port';
import { InMemorySessionRevocationBus } from './in-memory-session-revocation.bus';

@Module({
  providers: [
    InMemorySessionRevocationBus,
    {
      provide: SESSION_REVOCATION_PUBLISHER,
      useExisting: InMemorySessionRevocationBus,
    },
    {
      provide: SESSION_REVOCATION_SUBSCRIBER,
      useExisting: InMemorySessionRevocationBus,
    },
  ],
  exports: [SESSION_REVOCATION_PUBLISHER, SESSION_REVOCATION_SUBSCRIBER],
})
export class SessionRevocationModule {}
