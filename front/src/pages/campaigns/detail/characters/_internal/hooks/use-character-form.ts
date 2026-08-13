import { useState } from "react";
import type { Character, CreateCharacterDto } from "@donjon-dragon/shared";
import {
  useCreateCharacter,
  useUpdateCharacter,
} from "../queries/use-character-mutations";

const BLANK_SHEET: CreateCharacterDto = {
  name: "",
  race: "",
  characterClass: "",
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
};

export interface CharacterFormState {
  open: boolean;
  editing: Character | null;
  sheet: CreateCharacterDto;
  onOpen: (character: Character | null) => void;
  onOpenChange: (open: boolean) => void;
  onChange: (sheet: CreateCharacterDto) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function useCharacterForm(campaignId: string): CharacterFormState {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Character | null>(null);
  const [sheet, setSheet] = useState<CreateCharacterDto>(BLANK_SHEET);
  const create = useCreateCharacter(campaignId);
  const update = useUpdateCharacter(campaignId);

  return {
    open,
    editing,
    sheet,
    onOpen: (character) => openWith({ character, setEditing, setSheet, setOpen }),
    onOpenChange: setOpen,
    onChange: setSheet,
    onSubmit: () =>
      submitSheet({ editing, sheet, create, update, onDone: () => setOpen(false) }),
    isSubmitting: create.isPending || update.isPending,
  };
}

function openWith(params: {
  character: Character | null;
  setEditing: (character: Character | null) => void;
  setSheet: (sheet: CreateCharacterDto) => void;
  setOpen: (open: boolean) => void;
}): void {
  params.setEditing(params.character);
  params.setSheet(params.character ? toSheet(params.character) : BLANK_SHEET);
  params.setOpen(true);
}

type Mutator<T> = { mutate: (variables: T, options: { onSuccess: () => void }) => void };

function submitSheet(params: {
  editing: Character | null;
  sheet: CreateCharacterDto;
  create: Mutator<CreateCharacterDto>;
  update: Mutator<{ characterId: string; sheet: CreateCharacterDto }>;
  onDone: () => void;
}): void {
  const onSuccess = { onSuccess: params.onDone };
  if (params.editing) {
    params.update.mutate(
      { characterId: params.editing.id, sheet: params.sheet },
      onSuccess,
    );
  } else {
    params.create.mutate(params.sheet, onSuccess);
  }
}

function toSheet(character: Character): CreateCharacterDto {
  return {
    name: character.name,
    race: character.race,
    characterClass: character.characterClass,
    abilityScores: character.abilityScores,
  };
}
