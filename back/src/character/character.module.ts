import { Module } from '@nestjs/common';
import { CharacterController } from './interface/character.controller';

@Module({
  controllers: [CharacterController],
})
export class CharacterModule {}