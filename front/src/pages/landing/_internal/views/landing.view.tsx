import { PitchView } from "./pitch.view";
import { AuthPanelContainer } from "../containers/auth-panel.container";

/** L'accueil d'un visiteur : la présentation à gauche, l'accès à droite. */
export function LandingView() {
  return (
    <div className="auth-split">
      <PitchView />
      <AuthPanelContainer />
    </div>
  );
}
