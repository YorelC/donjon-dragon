import {
  SidebarLayoutView,
  type SidebarFooter,
  type SidebarNav,
} from "@/shared/components/layout/sidebar-layout.view";
import type { ProfileNavItem } from "../constants/profile-nav-items";
import type { ProfileIdentity } from "../hooks/use-profile-identity";

export interface ProfileNavigation {
  items: ProfileNavItem[];
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onNavigate: () => void;
}

export interface ProfileLayoutViewProps {
  nav: ProfileNavigation;
  identity: ProfileIdentity;
  /** La sortie de session vit au pied de la barre : le bandeau ne porte plus que le fil. */
  onLogout: () => void;
}

const SIDEBAR_HEADING = "Profil";
const MENU_LABEL = "Menu du profil";
const LOGOUT_LABEL = "Déconnexion";

export function ProfileLayoutView({ nav, identity, onLogout }: ProfileLayoutViewProps) {
  return (
    <SidebarLayoutView
      nav={toSidebarNav(nav)}
      footer={toSidebarFooter(identity, onLogout)}
    />
  );
}

function toSidebarNav(nav: ProfileNavigation): SidebarNav {
  return {
    heading: SIDEBAR_HEADING,
    menuLabel: MENU_LABEL,
    items: nav.items,
    isOpen: nav.isMenuOpen,
    onToggle: nav.onToggleMenu,
    onNavigate: nav.onNavigate,
  };
}

function toSidebarFooter(identity: ProfileIdentity, onLogout: () => void): SidebarFooter {
  return {
    title: identity.displayName,
    subtitle: toCompanionsLabel(identity),
    action: { label: LOGOUT_LABEL, onClick: onLogout },
  };
}

function toCompanionsLabel({ friendCount, pendingCount }: ProfileIdentity): string {
  const friends = `${friendCount} ${plural(friendCount, "ami")}`;
  if (pendingCount === 0) return friends;

  return `${friends} · ${pendingCount} ${plural(pendingCount, "demande")} en attente`;
}

function plural(count: number, word: string): string {
  return count > 1 ? `${word}s` : word;
}
