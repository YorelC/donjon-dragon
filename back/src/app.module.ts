import { Module } from '@nestjs/common';
import { CharacterModule } from './character/character.module';
import { CombatModule } from './combat/combat.module';

@Module({
  imports: [CharacterModule, CombatModule],
})
export class AppModule {}