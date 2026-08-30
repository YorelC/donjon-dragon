import type { CampaignDetail } from "@donjon-dragon/shared";
import {
  SidebarLayoutView,
  type SidebarFooter,
  type SidebarNav,
} from "@/shared/components/layout/sidebar-layout.view";
import type { QueryState } from "@/shared/types/ui-state";
import { toCampaignIdentity } from "../utils/campaign-identity";
import type { CampaignDetailNavItem } from "../constants/campaign-detail-nav-items";

export interface CampaignDetailNavigation {
  items: CampaignDetailNavItem[];
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onNavigate: () => void;
}

interface CampaignDetailLayoutViewProps {
  campaign: QueryState<CampaignDetail | null>;
  nav: CampaignDetailNavigation;
}

const SIDEBAR_HEADING = "Campagne";
const MENU_LABEL = "Menu de la campagne";

/**
 * Le cadre de la campagne ouverte. Le titre n'est pas ici : chaque écran porte
 * son propre en-tête, parce qu'il y pose aussi son action.
 */
export function CampaignDetailLayoutView({
  campaign,
  nav,
}: CampaignDetailLayoutViewProps) {
  if (campaign.loading)
    return <div className="empty-state-text">Chargement...</div>;
  if (campaign.error || !campaign.data)
    return (
      <div className="empty-state-text">
        Cette campagne est introuvable, ou tu n'en fais pas partie.
      </div>
    );

  return (
    <SidebarLayoutView
      nav={toSidebarNav(nav)}
      footer={toSidebarFooter(campaign.data)}
    />
  );
}

function toSidebarNav(nav: CampaignDetailNavigation): SidebarNav {
  return {
    heading: SIDEBAR_HEADING,
    menuLabel: MENU_LABEL,
    items: nav.items,
    isOpen: nav.isMenuOpen,
    onToggle: nav.onToggleMenu,
    onNavigate: nav.onNavigate,
  };
}

function toSidebarFooter(campaign: CampaignDetail): SidebarFooter {
  const identity = toCampaignIdentity(campaign);

  return { title: identity.roleLabel, subtitle: identity.membersLabel };
}
