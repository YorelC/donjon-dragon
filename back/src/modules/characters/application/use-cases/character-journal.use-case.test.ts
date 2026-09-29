import { randomUUID } from 'crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { CHARACTER_JOURNAL_RULES } from '@donjon-dragon/shared/character-journal-schema';
import { anActor } from '@kernel/testing/actor.fixture';
import { FixedClock, TEST_INSTANT } from '@kernel/testing/fixed-clock';
import { UserId } from '@kernel/domain/user-id';
import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import { aCampaign, withPlayer } from '@modules/campaigns/testing/campaign.fixture';
import { InMemoryCampaignRepository } from '@modules/campaigns/testing/in-memory-campaign.repository';

import { CharacterId } from '../../domain/character-id';
import { CharacterNotFoundError } from '../../domain/character.errors';
import { JournalChapter } from '../../domain/journal-chapter';
import {
  JournalChapterModifiedElsewhereError,
  JournalCommandConflictError,
  JournalFullError,
  JournalNotWritableError,
  JournalOrderMismatchError,
} from '../../domain/journal-chapter.errors';
import { OwningCampaignId } from '../../domain/owning-campaign-id';
import { aCharacterBody, seedAbilityRoll } from '../../testing/character.fixture';
import { InMemoryAbilityRollRepository } from '../../testing/in-memory-ability-roll.repository';
import { InMemoryCharacterCreationRepository } from '../../testing/in-memory-character-creation.repository';
import { InMemoryCharacterDirectory } from '../../testing/in-memory-character-directory';
import { InMemoryCharacterRepository } from '../../testing/in-memory-character.repository';
import { InMemoryItemCatalog } from '../../testing/in-memory-item-catalog';
import { InMemoryJournalChapterRepository } from '../../testing/in-memory-journal-chapter.repository';
import { InMemoryJournalCommandRepository } from '../../testing/in-memory-journal-command.repository';
import { CreateCharacterUseCase } from './create-character.use-case';
import { CreateJournalChapterUseCase } from './create-journal-chapter.use-case';
import { DeleteJournalChapterUseCase } from './delete-journal-chapter.use-case';
import { GetCharacterJournalUseCase } from './get-character-journal.use-case';
import { GetJournalChapterUseCase } from './get-journal-chapter.use-case';
import { ReorderJournalChaptersUseCase } from './reorder-journal-chapters.use-case';
import { UpdateJournalChapterUseCase } from './update-journal-chapter.use-case';

describe('journal de bord du personnage', () => {
  const gameMasterId = randomUUID();
  const frodoId = randomUUID();
  const samId = randomUUID();
  let campaignId: string;
  let frodoCharacterId: string;
  let freeCharacterId: string;
  let chapters: InMemoryJournalChapterRepository;
  let commands: InMemoryJournalCommandRepository;
  let journal: {
    read: GetCharacterJournalUseCase;
    open: GetJournalChapterUseCase;
    create: CreateJournalChapterUseCase;
    update: UpdateJournalChapterUseCase;
    remove: DeleteJournalChapterUseCase;
    reorder: ReorderJournalChaptersUseCase;
  };

  beforeEach(async () => {
    const campaigns = new InMemoryCampaignRepository();
    const campaign = withPlayer(aCampaign(gameMasterId), gameMasterId, frodoId);
    withPlayer(campaign, gameMasterId, samId);
    await campaigns.save(campaign);
    campaignId = campaign.id.value;
    const membership = new GetCampaignMembershipUseCase(campaigns);
    const characters = new InMemoryCharacterRepository();
    const clock = new FixedClock();
    const createCharacter = characterFactory(characters, membership, clock);
    frodoCharacterId = await createCharacter(frodoId);
    freeCharacterId = await createCharacter(gameMasterId);
    chapters = new InMemoryJournalChapterRepository();
    commands = new InMemoryJournalCommandRepository(chapters);
    journal = {
      read: new GetCharacterJournalUseCase(characters, chapters, membership),
      open: new GetJournalChapterUseCase(characters, chapters, membership),
      create: new CreateJournalChapterUseCase(characters, chapters, commands, membership, clock),
      update: new UpdateJournalChapterUseCase(characters, chapters, commands, membership, clock),
      remove: new DeleteJournalChapterUseCase(characters, chapters, commands, membership, clock),
      reorder: new ReorderJournalChaptersUseCase(characters, chapters, commands, membership, clock),
    };
  });

  function characterFactory(
    characters: InMemoryCharacterRepository,
    membership: GetCampaignMembershipUseCase,
    clock: FixedClock,
  ) {
    const rolls = new InMemoryAbilityRollRepository();
    const directory = new InMemoryCharacterDirectory();
    directory.register({ id: frodoId, displayName: 'Frodo' });
    const create = new CreateCharacterUseCase(
      characters, directory, new InMemoryItemCatalog(), membership, clock,
      new InMemoryCharacterCreationRepository(characters), rolls,
    );
    return async (creatorId: string) => {
      seedAbilityRoll(rolls, UserId.create(creatorId), campaignId);
      const created = await create.execute({
        ...aCharacterBody(), campaignId, actorId: anActor(creatorId), idempotencyKey: randomUUID(),
      });
      return created.id;
    };
  }

  function command(actorId: string, characterId = frodoCharacterId) {
    return { campaignId, characterId, actorId: anActor(actorId), idempotencyKey: randomUUID() };
  }

  function query(actorId: string, characterId = frodoCharacterId) {
    return { campaignId, characterId, actorId: anActor(actorId) };
  }

  async function aChapterOfFrodo(title = 'La taverne'): Promise<string> {
    return (await journal.create.execute({ ...command(frodoId), title })).id;
  }

  describe('lecture', () => {
    it('rend au joueur assigné un journal vide qu’il peut écrire', async () => {
      await expect(journal.read.execute(query(frodoId)))
        .resolves.toEqual({ chapters: [], canWrite: true });
    });

    it('rend au MJ le sommaire, en lecture seule, sans les textes', async () => {
      const chapterId = await aChapterOfFrodo();

      const read = await journal.read.execute(query(gameMasterId));

      expect(read.canWrite).toBe(false);
      expect(read.chapters).toEqual([
        { id: chapterId, title: 'La taverne', revision: 0, updatedAt: expect.any(String) },
      ]);
    });

    it('masque journal et chapitre à un autre joueur, comme la fiche', async () => {
      const chapterId = await aChapterOfFrodo();

      await expect(journal.read.execute(query(samId))).rejects.toThrow(CharacterNotFoundError);
      await expect(journal.open.execute({ ...query(samId), chapterId }))
        .rejects.toThrow(CharacterNotFoundError);
    });

    it('masque le journal à qui n’est pas membre de la campagne', async () => {
      await expect(journal.read.execute(query(randomUUID())))
        .rejects.toThrow(CharacterNotFoundError);
    });

    it('ne rend pas le chapitre d’un personnage sous un autre', async () => {
      const chapterId = await aChapterOfFrodo();

      await expect(journal.open.execute({ ...query(gameMasterId, freeCharacterId), chapterId }))
        .rejects.toThrow();
    });
  });

  describe('écriture', () => {
    it('ajoute un chapitre en dernier, puis l’enregistre à chaque sauvegarde', async () => {
      await aChapterOfFrodo('Premier');
      const chapterId = await aChapterOfFrodo('Second');

      const saved = await journal.update.execute({
        ...command(frodoId), chapterId, title: 'Second', body: '- [x] indice', expectedRevision: 0,
      });

      expect(saved.revision).toBe(1);
      const titles = (await journal.read.execute(query(frodoId))).chapters.map((c) => c.title);
      expect(titles).toEqual(['Premier', 'Second']);
      await expect(journal.open.execute({ ...query(frodoId), chapterId }))
        .resolves.toMatchObject({ body: '- [x] indice', revision: 1 });
    });

    it('refuse au MJ d’écrire le journal d’un personnage qui a son joueur', async () => {
      const chapterId = await aChapterOfFrodo();

      await expect(journal.create.execute({ ...command(gameMasterId), title: '' }))
        .rejects.toThrow(JournalNotWritableError);
      await expect(journal.update.execute({
        ...command(gameMasterId), chapterId, title: '', body: 'MJ', expectedRevision: 0,
      })).rejects.toThrow(JournalNotWritableError);
      await expect(journal.remove.execute({ ...command(gameMasterId), chapterId }))
        .rejects.toThrow(JournalNotWritableError);
    });

    it('laisse le MJ écrire le journal d’un personnage sans joueur', async () => {
      await journal.create.execute({ ...command(gameMasterId, freeCharacterId), title: 'Vivier' });

      const read = await journal.read.execute(query(gameMasterId, freeCharacterId));
      expect(read).toMatchObject({ canWrite: true, chapters: [{ title: 'Vivier' }] });
    });

    it('refuse un chapitre de plus que la capacité du journal', async () => {
      const character = CharacterId.create(frodoCharacterId);
      Array.from({ length: CHARACTER_JOURNAL_RULES.maxChapters }, (_, position) =>
        chapters.save(JournalChapter.create({
          campaignId: OwningCampaignId.create(campaignId), characterId: character,
          title: '', position, now: TEST_INSTANT,
        })));

      await expect(journal.create.execute({ ...command(frodoId), title: 'De trop' }))
        .rejects.toThrow(JournalFullError);
    });

    it('refuse une sauvegarde partie d’une version dépassée', async () => {
      const chapterId = await aChapterOfFrodo();
      const save = { chapterId, title: 'A', body: 'ordinateur', expectedRevision: 0 };
      await journal.update.execute({ ...command(frodoId), ...save });

      await expect(journal.update.execute({ ...command(frodoId), ...save, body: 'téléphone' }))
        .rejects.toThrow(JournalChapterModifiedElsewhereError);
    });

    it('rejoue une clé déjà servie sans réécrire, et refuse de la resservir ailleurs', async () => {
      const chapterId = await aChapterOfFrodo();
      const save = { ...command(frodoId), chapterId, title: 'A', body: 'x', expectedRevision: 0 };

      const first = await journal.update.execute(save);
      await expect(journal.update.execute(save)).resolves.toEqual(first);
      await expect(journal.update.execute({ ...save, body: 'y' }))
        .rejects.toThrow(JournalCommandConflictError);
    });

    it('supprime un chapitre', async () => {
      const chapterId = await aChapterOfFrodo();

      await journal.remove.execute({ ...command(frodoId), chapterId });

      await expect(journal.read.execute(query(frodoId)))
        .resolves.toMatchObject({ chapters: [] });
    });

    it('réordonne le journal, et refuse un ordre caduc', async () => {
      const first = await aChapterOfFrodo('Premier');
      const second = await aChapterOfFrodo('Second');

      await journal.reorder.execute({ ...command(frodoId), chapterIds: [second, first] });

      const titles = (await journal.read.execute(query(frodoId))).chapters.map((c) => c.title);
      expect(titles).toEqual(['Second', 'Premier']);
      await expect(journal.reorder.execute({ ...command(frodoId), chapterIds: [first] }))
        .rejects.toThrow(JournalOrderMismatchError);
    });

    it('n’inscrit jamais le titre ni le texte dans ce que l’audit retient', async () => {
      const chapterId = await aChapterOfFrodo('Secret du titre');
      await journal.update.execute({
        ...command(frodoId), chapterId, title: 'Secret du titre', body: 'Secret du texte',
        expectedRevision: 0,
      });

      const audited = JSON.stringify(commands.audited);
      expect(audited).not.toContain('Secret du titre');
      expect(audited).not.toContain('Secret du texte');
    });
  });
});
