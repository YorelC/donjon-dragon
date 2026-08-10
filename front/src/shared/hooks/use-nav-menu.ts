import { useState } from "react";
import { useLogout } from "@/shared/hooks/use-logout";

/** L'état du menu mobile et la déconnexion, que la nav affiche des deux côtés. */
export interface NavMenu {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void;
  onLogout: () => void;
}

export function useNavMenu(): NavMenu {
  const [isOpen, setIsOpen] = useState(false);
  const logout = useLogout();

  return {
    isOpen,
    onOpenChange: setIsOpen,
    onClose: () => setIsOpen(false),
    onLogout: logout,
  };
}
