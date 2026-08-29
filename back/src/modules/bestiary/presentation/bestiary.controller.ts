import { Controller, Get, Inject } from '@nestjs/common';
import {
  MonsterKeySchema,
  type Monster as MonsterDto,
} from '@donjon-dragon/shared/monster-schema';

import { ZodParam } from '@common/decorators/zod-validated.decorator';

import { FindMonsterByKeyUseCase } from '../application/use-cases/find-monster-by-key.use-case';
import { ListBestiaryUseCase } from '../application/use-cases/list-bestiary.use-case';

/**
 * Traduction HTTP seule. Aucun @UseGuards : le JwtAuthGuard est monté en
 * APP_GUARD dans app.module — le bestiaire n'est pas public pour autant.
 */
@Controller('bestiary')
export class BestiaryController {
  constructor(
    @Inject(ListBestiaryUseCase) private readonly list: ListBestiaryUseCase,
    @Inject(FindMonsterByKeyUseCase) private readonly find: FindMonsterByKeyUseCase,
  ) {}

  @Get()
  async listBestiary(): Promise<MonsterDto[]> {
    return this.list.execute();
  }

  /**
   * Le profil du manuel. La portée de campagne — celle qui laisserait un MJ
   * servir SON gobelin — est portée par le repository et le use-case, mais
   * aucune route ne l'expose encore : elle demande une route montée sous
   * `campaigns/:campaignId`, dont l'appartenance se vérifie.
   */
  @Get(':monsterKey')
  async findMonster(@ZodParam('monsterKey', MonsterKeySchema) monsterKey: string): Promise<MonsterDto> {
    return this.find.execute(monsterKey, null);
  }
}
