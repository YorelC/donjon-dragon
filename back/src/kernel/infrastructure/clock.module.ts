import { Module } from '@nestjs/common';

import { CLOCK } from '@kernel/application/clock.port';
import { SystemClock } from './system-clock';

/**
 * Fournit l'horloge aux modules qui l'importent.
 *
 * Volontairement PAS @Global() : un module qui date des événements le déclare, comme
 * il déclare son repository. Une horloge globale et invisible reproduirait
 * exactement ce qu'on vient de retirer du domaine — une dépendance au temps qu'on
 * ne voit pas en lisant le code.
 */
@Module({
  providers: [{ provide: CLOCK, useClass: SystemClock }],
  exports: [CLOCK],
})
export class ClockModule {}
