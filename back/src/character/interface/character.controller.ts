import { Body, Controller, Delete, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import type { Character, CreateCharacterDto } from '@donjon-dragon/shared/character-schema';

import { CreateCharacterUseCase } from '../application/create-character.use-case';
import { GetCharacterUseCase } from '../application/get-character.use-case';

@Controller('api/characters')
export class CharacterController {
  constructor(
    private readonly createUseCase: CreateCharacterUseCase,
    private readonly getUseCase: GetCharacterUseCase,
  ) {}

  @Post()
  create(@Body() dto: CreateCharacterDto, @Body('userId') userId: string): Promise<Character> {
    return this.createUseCase.execute(dto, userId);
  }

  @Get()
  getAllByUser(@Query('userId') userId: string): Promise<Character[]> {
    return this.getUseCase.findAllByUser(userId);
  }

  @Get(':id')
  getById(@Param('id') id: string): Promise<Character> {
    return this.getUseCase.execute(id);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Param('id') id: string): Promise<void> {
    return this.getUseCase.delete(id);
  }
}
