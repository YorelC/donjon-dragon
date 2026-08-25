import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import { useNavMenu, type NavMenu } from "@/shared/hooks/use-nav-menu";
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
    <nav className="hidden justify-center gap-4 md:flex">
      <NavLinks />
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
    <nav className="flex flex-col gap-4 p-4">
      <NavLinks onLinkClick={menu.onClose} />
      <LogoutButton onLogout={closeThen(menu.onLogout)} />
    </nav>
  );
}

interface NavLinkDescriptor {
  route: string;
  label: string;
}

const NAV_LINKS: NavLinkDescriptor[] = [
  { route: ROUTES.home, label: "Accueil" },
  { route: ROUTES.campaigns, label: "Campagnes" },
  { route: ROUTES.profile, label: "Profil" },
];

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <>
      {NAV_LINKS.map((link) => (
        <Link key={link.route} to={link.route} onClick={onLinkClick}>
          {link.label}
        </Link>
      ))}
    </>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      onClick={onLogout}
      className="font-display text-xs tracking-label text-destructive uppercase transition-colors duration-[.18s] hover:text-gold-selected"
    >
      Déconnexion
    </button>
  );
}
