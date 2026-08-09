import { Injectable } from '@nestjs/common';

import type { Clock } from '@kernel/application/clock.port';

/**
 * L'horloge réelle. C'est le SEUL endroit du code de production qui lit
 * `new Date()` pour dater un événement métier — tout le reste reçoit l'instant.
 */
@Injectable()
export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
