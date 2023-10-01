import Button from "../components/bases/buttons/Buttons";
import { labelAndStylesButtonBase } from "../components/bases/buttons/buttonsUtils";

function Home() {
  const label: labelAndStylesButtonBase = {
    label: "Personnage Joueurs",
  };

  return (
    <section>
      <Button
        labelAndStylesButtonBase={label}
        onClick={() => console.log("Créer un personnage")}
      />
    </section>
  );
}

export default Home;
