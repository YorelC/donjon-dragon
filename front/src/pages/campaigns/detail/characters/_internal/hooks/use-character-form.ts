import { useState } from "react";
import type { Character } from "@donjon-dragon/shared";
import {
  useRenameCharacter,
  useStartCharacter,
} from "../queries/use-character-mutations";

export interface CharacterFormState {
  open: boolean;
  editing: Character | null;
  name: string;
  onOpen: (character: Character | null) => void;
  onOpenChange: (open: boolean) => void;
  onChange: (name: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

/**
 * Le formulaire ne porte plus que le nom : créer un personnage ouvre un
 * brouillon, et les choix d'espèce, de classe et d'historique appartiennent au
 * builder. Rouvrir ce formulaire sur un personnage existant le renomme.
 */
export function useCharacterForm(campaignId: string): CharacterFormState {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Character | null>(null);
  const [name, setName] = useState("");
  const start = useStartCharacter(campaignId);
  const rename = useRenameCharacter(campaignId);

  return {
    open,
    editing,
    name,
    onOpen: (character) => openWith({ character, setEditing, setName, setOpen }),
    onOpenChange: setOpen,
    onChange: setName,
    onSubmit: () =>
      submitName({ editing, name, start, rename, onDone: () => setOpen(false) }),
    isSubmitting: start.isPending || rename.isPending,
  };
}

function openWith(params: {
  character: Character | null;
  setEditing: (character: Character | null) => void;
  setName: (name: string) => void;
  setOpen: (open: boolean) => void;
}): void {
  params.setEditing(params.character);
  params.setName(params.character?.name ?? "");
  params.setOpen(true);
}

type Mutator<T> = { mutate: (variables: T, options: { onSuccess: () => void }) => void };

function submitName(params: {
  editing: Character | null;
  name: string;
  start: Mutator<{ name: string }>;
  rename: Mutator<{ characterId: string; name: string }>;
  onDone: () => void;
}): void {
  const onSuccess = { onSuccess: params.onDone };
  if (params.editing) {
    params.rename.mutate({ characterId: params.editing.id, name: params.name }, onSuccess);
  } else {
    params.start.mutate({ name: params.name }, onSuccess);
  }
}
