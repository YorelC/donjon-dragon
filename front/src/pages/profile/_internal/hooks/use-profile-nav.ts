import { useState, useCallback } from "react";
import { toProfileNavItems } from "../constants/profile-nav-items";
import { useProfileNavCounts } from "./use-profile-nav-counts";

export function useProfileNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const counts = useProfileNavCounts();

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return {
    items: toProfileNavItems(counts),
    isMenuOpen,
    toggleMenu,
    closeMenu,
  };
}
