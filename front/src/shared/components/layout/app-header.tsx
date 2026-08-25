import { Link } from "react-router-dom";
import { Diamond } from "@/shared/components/molecules/diamond";
import { ROUTES } from "@/shared/constants/routes";
import { Nav } from "@/shared/components/layout/nav";
import { useAuthStore } from "@/shared/stores/auth.store";

const VISITOR_TAGLINE = "Accès à votre table";

/**
 * Bandeau de tête, présent sur toute page : la marque à gauche, la navigation à
 * droite. Un visiteur n'a rien à naviguer : il reçoit la devise d'accès.
 */
export function AppHeader() {
  const isAuthenticated = useAuthStore((s) => s.user !== null);

  return (
    <header className="app-header">
      <BrandMark />
      {isAuthenticated ? <Nav /> : <HeaderTagline />}
    </header>
  );
}

function BrandMark() {
  return (
    <Link to={ROUTES.home} className="flex min-w-0 items-center gap-3">
      <Diamond tone="filled" />
      <span className="wordmark">Donjons &amp; Dragons</span>
    </Link>
  );
}

function HeaderTagline() {
  return <span className="eyebrow whitespace-nowrap">{VISITOR_TAGLINE}</span>;
}
