import type { ComponentType } from "react";
import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import { cn } from "@/shared/utils/utils";
import { useNavMenu, type NavMenu } from "@/shared/hooks/use-nav-menu";
import { CampaignInvitesBadge } from "@/shared/components/layout/campaign-invites-badge";
import { ProfileRequestsBadge } from "@/shared/components/layout/profile-requests-badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/shared/components/atoms/sheet";

export function Nav() {
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const menu = useNavMenu();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <DesktopNav menu={menu} />
      <MobileNav menu={menu} />
    </div>
  );
}

function DesktopNav({ menu }: { menu: NavMenu }) {
  return (
    <nav className="hidden items-center md:flex">
      <NavLinks />
      <div aria-hidden className="nav-divider" />
      <LogoutButton onLogout={menu.onLogout} />
    </nav>
  );
}

function MobileNav({ menu }: { menu: NavMenu }) {
  return (
    <Sheet open={menu.isOpen} onOpenChange={menu.onOpenChange}>
      <MobileNavTrigger />
      <SheetContent side="left">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <MobileNavMenu menu={menu} />
      </SheetContent>
    </Sheet>
  );
}

function MobileNavTrigger() {
  return (
    <SheetTrigger
      aria-label="Menu de navigation"
      className="md:hidden"
    >
      <Menu />
    </SheetTrigger>
  );
}

function MobileNavMenu({ menu }: { menu: NavMenu }) {
  // Naviguer depuis le tiroir doit le refermer, se déconnecter aussi.
  const closeThen = (action: () => void) => () => {
    menu.onClose();
    action();
  };

  return (
    <nav className="flex flex-col items-start gap-2 p-4">
      <NavLinks onLinkClick={menu.onClose} />
      <LogoutButton onLogout={closeThen(menu.onLogout)} />
    </nav>
  );
}

interface NavLinkDescriptor {
  route: string;
  label: string;
  /** Le compteur de l'onglet, quand il en porte un : chacun compte autre chose. */
  Badge?: ComponentType;
}

// L'accueil n'est pas un onglet : le losange de marque y ramène déjà.
const NAV_LINKS: NavLinkDescriptor[] = [
  { route: ROUTES.campaigns, label: "Campagnes", Badge: CampaignInvitesBadge },
  { route: ROUTES.profile, label: "Profil", Badge: ProfileRequestsBadge },
];

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <>
      {NAV_LINKS.map((link) => (
        <NavTab key={link.route} link={link} onLinkClick={onLinkClick} />
      ))}
    </>
  );
}

interface NavTabProps {
  link: NavLinkDescriptor;
  onLinkClick?: () => void;
}

function NavTab({ link, onLinkClick }: NavTabProps) {
  return (
    <NavLink to={link.route} onClick={onLinkClick} className={toNavLinkClassName}>
      <span>{link.label}</span>
      {link.Badge ? <link.Badge /> : null}
    </NavLink>
  );
}

function toNavLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn("nav-link", isActive && "nav-link-on");
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button onClick={onLogout} className="nav-link">
      Déconnexion
    </button>
  );
}
