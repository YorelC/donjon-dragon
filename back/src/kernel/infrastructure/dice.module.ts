import { Module } from '@nestjs/common';

import { DICE } from '@kernel/application/dice.port';
import { CryptoDice } from './crypto-dice';

/**
 * Fournit le dé aux modules qui l'importent.
 *
 * Pas @Global(), pour la même raison que `ClockModule` : un module qui tire des
 * dés le déclare. Une source d'aléa globale et invisible serait exactement ce
 * qu'on vient de sortir du domaine.
 */
@Module({
  providers: [{ provide: DICE, useClass: CryptoDice }],
  exports: [DICE],
})
export class DiceModule {}
