import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { useAuthStore } from "@/shared/stores/auth.store";
import { ROUTES } from "@/shared/constants/routes";
import { useLogout } from "@/pages/login/_internal/queries/use-logout";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/shared/components/atoms/sheet";

export function Nav() {
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const { mutate } = useLogout();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = () => {
    mutate(refreshToken ?? "", {
      onSettled: () => {
        clearAuth();
        navigate(ROUTES.home);
      },
    });
  };

  return (
    <div className="relative pb-6">
      <DesktopNav onLogout={handleLogout} />
      <MobileNav
        isOpen={isMenuOpen}
        onOpenChange={setIsMenuOpen}
        onLogout={handleLogout}
      />
    </div>
  );
}

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  return (
    <>
      <Link to={ROUTES.home} onClick={onLinkClick}>
        Accueil
      </Link>
      <Link to={ROUTES.characters} onClick={onLinkClick}>
        Personnages
      </Link>
      <Link to={ROUTES.combat} onClick={onLinkClick}>
        Combat
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

function DesktopNav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="hidden justify-center gap-4 md:flex">
      <NavLinks />
      <LogoutButton onLogout={onLogout} />
    </nav>
  );
}

function MobileNav({
  isOpen,
  onOpenChange,
  onLogout,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
}) {
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
        <nav className="flex flex-col gap-4 p-4">
          <NavLinks onLinkClick={closeMenu} />
          <LogoutButton
            onLogout={() => {
              closeMenu();
              onLogout();
            }}
          />
        </nav>
      </SheetContent>
    </Sheet>
  );
}
