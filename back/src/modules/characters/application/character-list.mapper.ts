import type {
  CampaignCharacterListItem,
  Character as CharacterDto,
} from '@donjon-dragon/shared/character-schema';
import type { UserId } from '@kernel/domain/user-id';

import type { CharacterDirectoryUser } from './ports/character-directory.port';
import { toCharacterDto } from './character.mapper';
import type { Character } from '../domain/character';

/**
 * La projection depend de qui regarde. Le joueur assigne arrive resolu par le
 * use-case : ce mapper ne lit rien, il choisit une forme.
 */
export interface CharacterListViewer {
  id: UserId;
  isGameMaster: boolean;
}

export function toCharacterListItem(
  character: Character,
  viewer: CharacterListViewer,
  assignedPlayer: CharacterDirectoryUser | null,
): CampaignCharacterListItem {
  const dto = toCharacterDto(character, viewer.id, assignedPlayer);
  if (viewer.isGameMaster) return gameMasterProjection(dto);
  if (character.assignedTo?.equals(viewer.id)) return controlledProjection(dto);
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
