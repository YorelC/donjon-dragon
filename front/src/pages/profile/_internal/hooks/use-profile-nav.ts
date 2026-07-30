import { useState, useCallback } from "react";
import { PROFILE_NAV_ITEMS } from "../constants/profile-nav-items";

export function useProfileNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return {
    items: PROFILE_NAV_ITEMS,
    isMenuOpen,
    toggleMenu,
    closeMenu,
  };
}
