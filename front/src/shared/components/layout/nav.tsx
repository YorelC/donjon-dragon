import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import { useLogout } from "@/shared/hooks/use-logout";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/shared/components/atoms/sheet";

export function Nav() {
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const logout = useLogout();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative pb-6">
      <DesktopNav onLogout={logout} />
      <MobileNav
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        onLogout={logout}
      />
    </div>
  );
}

function DesktopNav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="hidden justify-center gap-4 md:flex">
      <NavLinks />
      <LogoutButton onLogout={onLogout} />
    </nav>
  );
}

interface MobileNavProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
}

function MobileNav({ isOpen, onOpenChange, onLogout }: MobileNavProps) {
  const closeMenu = () => onOpenChange(false);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger
        aria-label="Menu de navigation"
        className="absolute top-0 left-0 md:hidden"
      >
        <Menu />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <MobileNavMenu onClose={closeMenu} onLogout={onLogout} />
      </SheetContent>
    </Sheet>
  );
}

function MobileNavMenu({
  onClose,
  onLogout,
}: {
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <nav className="flex flex-col gap-4 p-4">
      <NavLinks onLinkClick={onClose} />
      <LogoutButton
        onLogout={() => {
          onClose();
          onLogout();
        }}
      />
    </nav>
  );
}

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <>
      <Link to={ROUTES.home} onClick={onLinkClick}>
        Accueil
      </Link>
      <Link to={ROUTES.campaigns} onClick={onLinkClick}>
        Campagnes
      </Link>
      <Link to={ROUTES.profile} onClick={onLinkClick}>
        Profil
      </Link>
    </>
  );
}

function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      onClick={onLogout}
      className="font-semibold text-red-600 hover:text-red-700"
    >
      Déconnexion
    </button>
  );
}
