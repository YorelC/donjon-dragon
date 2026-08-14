import { useParams } from "react-router-dom";
import { useWizardScreen } from "../hooks/use-wizard-screen";
import { CharacterWizardView } from "../views/character-wizard.view";

export function CharacterWizardContainer() {
  const { campaignId = "", characterId = "" } = useParams();
  const screen = useWizardScreen({ campaignId, characterId });
  if (!screen) return null;

  return <CharacterWizardView screen={screen} />;
}
