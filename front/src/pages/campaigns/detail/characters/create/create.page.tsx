import { CharacterWizardContainer } from "./_internal/containers/character-wizard.container";

export function CharacterCreatePage() {
  return (
    <section className="grid gap-4">
      <h2 className="page-title text-xl">Création de personnage</h2>
      <CharacterWizardContainer />
    </section>
  );
}
