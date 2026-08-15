import { SettingsView } from "../views/settings.view";

/**
 * Rien à préparer tant que la page est un écran d'attente. Le container existe
 * quand même : c'est lui que la route rend, et c'est ici qu'arriveront les hooks
 * des vrais paramètres.
 */
export function SettingsContainer() {
  return <SettingsView />;
}
