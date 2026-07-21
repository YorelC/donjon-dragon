// ============================================================
// back/test/integration/character/repository/character.repository.test.ts
// Tests — InMemoryCharacterRepository (CRUD complet)
// ============================================================
// RED: ces tests échouent car CharacterRepositoryPort et
// InMemoryCharacterRepository n'existent pas
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryCharacterRepository } from '../../../../src/character/infrastructure/in-memory-character.repository.js';
import type { Character } from '@donjon-dragon/shared/character-schema.js';

describe('InMemoryCharacterRepository', () => {
  let repo: InMemoryCharacterRepository;

  const mockCharacter = (overrides: Partial<Character> = {}): Character => ({
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Test Hero',
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
    hitPoints: 14,
    armorClass: 12,
    proficiencyBonus: 2,
    equipment: [],
    spells: [],
    userId: 'user-1',
    createdAt: '2026-07-19T12:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    repo = new InMemoryCharacterRepository();
  });

  describe('save()', () => {
    it('sauvegarde un personnage et le retourne', async () => {
      const char = mockCharacter();
      const saved = await repo.save(char);
      expect(saved).toEqual(char);
    });

    it('sauvegarde plusieurs personnages distincts', async () => {
      const a = mockCharacter({ id: 'id-a', name: 'A' });
      const b = mockCharacter({ id: 'id-b', name: 'B' });
      await repo.save(a);
      await repo.save(b);
      const all = await repo.findAllByUserId('user-1');
      expect(all).toHaveLength(2);
    });

    it('écrase un personnage existant (même id)', async () => {
      const original = mockCharacter({ name: 'Original' });
      await repo.save(original);
      const updated = mockCharacter({ name: 'Updated' });
      await repo.save(updated);
      const found = await repo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found?.name).toBe('Updated');
    });
  });

  describe('findById()', () => {
    it('retourne le personnage par id', async () => {
      const char = mockCharacter();
      await repo.save(char);
      const found = await repo.findById(char.id);
      expect(found).toEqual(char);
    });

    it('retourne null si introuvable', async () => {
      const found = await repo.findById('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findAllByUserId()', () => {
    it('retourne tous les personnages d\'un utilisateur', async () => {
      await repo.save(mockCharacter({ id: 'id-1', userId: 'user-1' }));
      await repo.save(mockCharacter({ id: 'id-2', userId: 'user-1' }));
      await repo.save(mockCharacter({ id: 'id-3', userId: 'user-2' }));
      const user1Chars = await repo.findAllByUserId('user-1');
      expect(user1Chars).toHaveLength(2);
    });

    it('retourne [] si aucun personnage', async () => {
      const chars = await repo.findAllByUserId('empty-user');
      expect(chars).toEqual([]);
    });
  });

  describe('delete()', () => {
    it('supprime un personnage existant', async () => {
      await repo.save(mockCharacter());
      await repo.delete('550e8400-e29b-41d4-a716-446655440000');
      const found = await repo.findById('550e8400-e29b-41d4-a716-446655440000');
      expect(found).toBeNull();
    });

    it('ne fait rien si id inexistant (pas d\'erreur)', async () => {
      await expect(
        repo.delete('nonexistent'),
      ).resolves.toBeUndefined();
    });
  });
});