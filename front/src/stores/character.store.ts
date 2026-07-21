import { create } from "zustand";

interface CharacterStoreState {
  selectedCharacterId: string | null;
  selectCharacter: (id: string | null) => void;
}

export const useCharacterStore = create<CharacterStoreState>((set) => ({
  selectedCharacterId: null,
  selectCharacter: (id) => set({ selectedCharacterId: id }),
}));
