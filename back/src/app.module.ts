import { Module } from '@nestjs/common';
import { CharacterModule } from './character/interface/character.module';
import { CombatModule } from './combat/interface/combat.module';

@Module({
  imports: [CharacterModule, CombatModule],
})
export class AppModule {}