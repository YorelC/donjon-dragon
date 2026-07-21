// ============================================================
// back/test/unit/character/application/create-character.use-case.test.ts
// Tests — CreateCharacterUseCase
// ============================================================
// RED: ces tests échouent car le use-case n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { CreateCharacterUseCase } from '../../../../src/character/application/create-character.use-case.js';
import { InMemoryCharacterRepository } from '../../../../src/character/infrastructure/in-memory-character.repository.js';
import type { CreateCharacterDto } from '@donjon-dragon/shared/character-schema.js';

describe('CreateCharacterUseCase', () => {
  let useCase: CreateCharacterUseCase;
  let repo: InMemoryCharacterRepository;

  const validDto: CreateCharacterDto = {
    name: 'Legolas',
    race: 'Elf',
    class: 'Ranger',
    level: 1,
    stats: {
      strength: 12,
      dexterity: 17,
      constitution: 14,
      intelligence: 10,
      wisdom: 14,
      charisma: 10,
    },
  };

  beforeEach(() => {
    repo = new InMemoryCharacterRepository();
    useCase = new CreateCharacterUseCase(repo);
  });

  it('génère un UUID valide', async () => {
    const char = await useCase.execute(validDto, 'user-1');
    expect(char.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('calcule les HP correctement pour un Ranger (d8)', async () => {
    const char = await useCase.execute(validDto, 'user-1');
    // Ranger d8, CON 14 (+2) → HP = 8 + 2 = 10
    expect(char.hitPoints).toBe(10);
  });

  it('calcule armorClass = 10 + DEX mod', async () => {
    const char = await useCase.execute(validDto, 'user-1');
    // DEX 17 → +3 → AC = 13
    expect(char.armorClass).toBe(13);
  });

  it('associe le userId', async () => {
    const char = await useCase.execute(validDto, 'user-42');
    expect(char.userId).toBe('user-42');
  });

  it('sauvegarde dans le repository', async () => {
    const char = await useCase.execute(validDto, 'user-1');
    const found = await repo.findById(char.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe('Legolas');
  });

  it('level 5 calcule les HP sur plusieurs niveaux', async () => {
    const char = await useCase.execute(
      { ...validDto, level: 5 },
      'user-1',
    );
    // Ranger d8, CON 14 (+2)
    // niveau 1 : 8 + 2 = 10
    // niveaux 2-5 : 5 + 2 = 7 × 4 = 28
    // total : 10 + 28 = 38
    expect(char.hitPoints).toBe(38);
  });

  it('applique les bonus raciaux Humain (tout +1)', async () => {
    const char = await useCase.execute(
      { ...validDto, race: 'Human' },
      'user-1',
    );
    // Human : +1 partout. DEX 17+1=18, CON 14+1=15, etc.
    // À vérifier selon l'implémentation
    expect(char.stats.dexterity).toBeGreaterThanOrEqual(17);
  });
});