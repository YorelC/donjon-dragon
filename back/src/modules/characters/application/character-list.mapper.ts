import type {
  CampaignCharacterListItem,
  Character as CharacterDto,
} from '@donjon-dragon/shared/character-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { CharacterDirectoryPort } from './ports/character-directory.port';
import { toCharacterDtoResolved } from './character.mapper';
import type { Character } from '../domain/character';

export async function toCharacterListItem(
  directory: CharacterDirectoryPort,
  character: Character,
  viewerId: UserId,
  viewerIsGameMaster: boolean,
): Promise<CampaignCharacterListItem> {
  const dto = await toCharacterDtoResolved(directory, character, viewerId);
  if (viewerIsGameMaster) return gameMasterProjection(dto);
  if (character.assignedTo?.equals(viewerId)) return controlledProjection(dto);
  return poolProjection(dto);
}

function gameMasterProjection(dto: CharacterDto): CampaignCharacterListItem {
  return { projection: 'gameMaster', ...controlledFields(dto), createdByMe: dto.createdByMe };
}

function controlledProjection(dto: CharacterDto): CampaignCharacterListItem {
  return { projection: 'controlled', ...controlledFields(dto) };
}

function controlledFields(dto: CharacterDto) {
  return { ...poolFields(dto), build: dto.build, assignedTo: dto.assignedTo, revision: dto.revision };
}

function poolProjection(dto: CharacterDto): CampaignCharacterListItem {
  return { projection: 'pool', ...poolFields(dto) };
}

function poolFields(dto: CharacterDto) {
  return {
    id: dto.id,
    name: dto.name,
    portrait: null,
    status: dto.status,
    speciesName: dto.build.speciesName,
    lineageName: dto.build.lineageName,
    className: dto.build.className,
    level: 1,
    assignmentStatus: dto.assignedTo ? 'assigned' as const : 'available' as const,
  };
}
