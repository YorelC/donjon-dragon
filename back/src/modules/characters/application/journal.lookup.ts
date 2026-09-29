import { GetCampaignMembershipUseCase } from '@modules/campaigns/application/use-cases/get-campaign-membership.use-case';
import type { ActorId } from '@kernel/domain/actor-id';
import { UserId } from '@kernel/domain/user-id';

import type { CharacterRepositoryPort } from './ports/character.repository.port';
import type { JournalChapterRepositoryPort } from './ports/journal-chapter.repository.port';
import { loadCampaignCharacter } from './character.lookup';
import type { Character } from '../domain/character';
import { CharacterNotFoundError } from '../domain/character.errors';
import { journalAccessOf, type JournalAccess } from '../domain/journal-access';
import type { JournalChapter } from '../domain/journal-chapter';
import { JournalChapterId } from '../domain/journal-chapter-id';
import { JournalChapterNotFoundError } from '../domain/journal-chapter.errors';

export interface JournalLookupPorts {
  characters: CharacterRepositoryPort;
  membership: GetCampaignMembershipUseCase;
}

export interface JournalQuery {
  campaignId: string;
  characterId: string;
  actorId: ActorId;
}

export interface OpenedJournal {
  character: Character;
  access: JournalAccess;
  actorIsGameMaster: boolean;
}

/**
 * La lecture que fait tout use-case du journal avant d'agir : le rôle de
 * l'appelant d'abord, pour qu'un non-membre ne distingue pas un personnage qui
 * existe d'un personnage qui n'existe pas.
 */
export async function openJournal(
  ports: JournalLookupPorts,
  query: JournalQuery,
): Promise<OpenedJournal> {
  const role = await ports.membership.execute({
    campaignId: query.campaignId, userId: query.actorId,
  });
  if (!role.isActiveMember) throw new CharacterNotFoundError();
  const character = await loadCampaignCharacter(
    ports.characters, query.campaignId, query.characterId,
  );
  const reader = { actorId: UserId.create(query.actorId), actorIsGameMaster: role.isGameMaster };
  return { character, access: journalAccessOf(character, reader), actorIsGameMaster: role.isGameMaster };
}

export async function loadJournalChapter(
  chapters: JournalChapterRepositoryPort,
  character: Character,
  chapterId: string,
): Promise<JournalChapter> {
  const chapter = await chapters.findByCharacterAndId(
    character.id, JournalChapterId.create(chapterId),
  );
  if (!chapter) throw new JournalChapterNotFoundError();
  return chapter;
}
