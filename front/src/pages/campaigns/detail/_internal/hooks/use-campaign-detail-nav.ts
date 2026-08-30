import { useState, useCallback } from "react";
import { toCampaignDetailNavItems } from "../constants/campaign-detail-nav-items";

export function useCampaignDetailNav(campaignId: string) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  return {
    items: toCampaignDetailNavItems(campaignId),
    isMenuOpen,
    toggleMenu,
    closeMenu,
  };
}
