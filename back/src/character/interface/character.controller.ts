import { Controller, Get } from '@nestjs/common';

@Controller('characters')
export class CharacterController {
  @Get()
  findAll() {
    return [];
  }
}