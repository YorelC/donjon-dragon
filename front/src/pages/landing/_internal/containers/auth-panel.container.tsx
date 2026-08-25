import { AuthPanelView } from "../views/auth-panel.view";
import { useAuthTab } from "../hooks/use-auth-tab";

export function AuthPanelContainer() {
  const defaultTab = useAuthTab();

  return <AuthPanelView defaultTab={defaultTab} />;
}
