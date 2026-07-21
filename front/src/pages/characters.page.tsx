import useLocalStorage from "@/hooks/useLocalStorage";
import { useCharacters, useDeleteCharacter } from "@/features/character/hooks/use-character";
import { CharacterFormContainer } from "@/features/character/character-form.container";
import { CharacterSheetView } from "@/features/character/character-sheet.view";
import { Button } from "@/components/atoms/button";
import { useCharacterStore } from "@/stores/character.store";

export function CharactersPage() {
  const [userId] = useLocalStorage("dd-user-id", crypto.randomUUID());
  const { data: characters, isLoading } = useCharacters(userId);
  const deleteCharacter = useDeleteCharacter();
  const { selectedCharacterId, selectCharacter } = useCharacterStore();

  const selected = characters?.find((c) => c.id === selectedCharacterId) ?? null;

  return (
    <div className="mx-auto grid max-w-4xl gap-6 p-6 md:grid-cols-2">
      <section>
        <h2 className="mb-3 text-lg font-semibold">Nouveau personnage</h2>
        <CharacterFormContainer userId={userId} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Mes personnages</h2>
        {isLoading && <p>Chargement...</p>}
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
