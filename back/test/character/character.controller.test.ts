// ============================================================
// back/test/character/character.controller.test.ts
// Tests — CharacterController REST
// ============================================================
// RED: ces tests échouent car le controller n'existe pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { CharacterController } from '../../src/character/interface/character.controller.js';
import { InMemoryCharacterRepository } from '../../src/character/infrastructure/in-memory-character.repository.js';
import { CreateCharacterUseCase } from '../../src/character/application/create-character.use-case.js';
import { GetCharacterUseCase } from '../../src/character/application/get-character.use-case.js';
import type { CreateCharacterDto } from '@donjon-dragon/shared/character-schema.js';

describe('CharacterController', () => {
  let repo: InMemoryCharacterRepository;
  let createUseCase: CreateCharacterUseCase;
  let getUseCase: GetCharacterUseCase;
  let controller: CharacterController;

  const validDto: CreateCharacterDto = {
    name: 'Aragorn',
    race: 'Human',
    class: 'Fighter',
    level: 1,
    stats: {
      strength: 15,
      dexterity: 14,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 10,
    },
  };

  beforeEach(() => {
    repo = new InMemoryCharacterRepository();
    createUseCase = new CreateCharacterUseCase(repo);
    getUseCase = new GetCharacterUseCase(repo);
    controller = new CharacterController(createUseCase, getUseCase);
  });

  describe('POST /api/characters — create()', () => {
    it('crée un personnage et retourne 201', async () => {
      const result = await controller.create(validDto, 'user-1');
      expect(result).toHaveProperty('id');
      expect(result.name).toBe('Aragorn');
      expect(result.userId).toBe('user-1');
      expect(result.hitPoints).toBeGreaterThan(0);
    });

    it('personnage sauvegardé → accessible via get', async () => {
      const created = await controller.create(validDto, 'user-1');
      const found = await controller.getById(created.id);
      expect(found).toEqual(created);
    });
  });

  describe('GET /api/characters — getAll()', () => {
    it('retourne une liste vide pour un utilisateur sans personnages', async () => {
      const chars = await controller.getAllByUser('empty-user');
      expect(chars).toEqual([]);
    });

    it('retourne les personnages de l\'utilisateur', async () => {
      await controller.create(validDto, 'user-1');
      await controller.create({ ...validDto, name: 'Gandalf' }, 'user-1');
      const chars = await controller.getAllByUser('user-1');
      expect(chars).toHaveLength(2);
    });

    it('ne mélange pas les personnages entre utilisateurs', async () => {
      await controller.create(validDto, 'user-1');
      await controller.create({ ...validDto, name: 'Gandalf' }, 'user-2');
      const user1Chars = await controller.getAllByUser('user-1');
      const user2Chars = await controller.getAllByUser('user-2');
      expect(user1Chars).toHaveLength(1);
      expect(user2Chars).toHaveLength(1);
    });
  });

  describe('GET /api/characters/:id — getById()', () => {
    it('retourne 404 si id inexistant', async () => {
      await expect(
        controller.getById('nonexistent'),
      ).rejects.toThrow(/not found/i);
    });

    it('retourne le personnage si trouvé', async () => {
      const created = await controller.create(validDto, 'user-1');
      const found = await controller.getById(created.id);
      expect(found.id).toBe(created.id);
    });
  });

  describe('DELETE /api/characters/:id — delete()', () => {
    it('supprime un personnage existant', async () => {
      const created = await controller.create(validDto, 'user-1');
      await expect(
        controller.delete(created.id),
      ).resolves.toBeUndefined();
    });

    it('retourne 404 si id inexistant', async () => {
      await expect(
        controller.delete('nonexistent'),
      ).rejects.toThrow(/not found/i);
    });
  });
});
