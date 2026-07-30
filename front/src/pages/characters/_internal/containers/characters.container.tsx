import useLocalStorage from "@/shared/hooks/useLocalStorage";
import { useCharacters, useDeleteCharacter } from "../queries/use-character";
import { CharacterFormContainer } from "./character-form.container";
import { CharacterSheetView } from "../views/character-sheet.view";
import { Button } from "@/shared/components/atoms/button";
import { useCharacterStore } from "../stores/character.store";

export function CharactersContainer() {
  const [userId] = useLocalStorage("dd-user-id", crypto.randomUUID());
  const { data: characters, isLoading } = useCharacters(userId);
  const deleteCharacter = useDeleteCharacter();
  const { selectedCharacterId, selectCharacter } = useCharacterStore();

  const selected = characters?.find((c) => c.id === selectedCharacterId) ?? null;

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-6 md:grid-cols-2">
      <section>
        <h2 className="section-title">Nouveau personnage</h2>
        <CharacterFormContainer userId={userId} />
      </section>

      <section>
        <h2 className="section-title">Mes personnages</h2>
        {isLoading && <p className="muted-text">Chargement...</p>}
        <ul className="flex flex-col gap-2">
          {characters?.map((character) => (
            <li key={character.id} className="flex items-center justify-between rounded-md border p-2">
              <button type="button" className="text-left" onClick={() => selectCharacter(character.id)}>
                {character.name} (Niv. {character.level})
              </button>
              <Button variant="ghost" size="sm" onClick={() => deleteCharacter.mutate(character.id)}>
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
        {selected && (
          <div className="mt-4">
            <CharacterSheetView character={selected} />
          </div>
        )}
      </section>
    </div>
  );
}
