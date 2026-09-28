import { Link } from "react-router-dom";
import { Diamond } from "@/shared/components/molecules/diamond";
import { ROUTES } from "@/shared/constants/routes";
import { AppBreadcrumb } from "@/shared/components/layout/breadcrumb.container";
import { useGuardedFollow } from "@/shared/hooks/use-guarded-follow";
import { useAuthStore } from "@/shared/stores/auth.store";

const VISITOR_TAGLINE = "Accès à votre table";

/**
 * Bandeau de tête, présent sur toute page : la marque, puis le fil d'Ariane. Les
 * écrans voisins sont dans la barre latérale ; le bandeau dit seulement où l'on
 * est. Un visiteur n'a rien à parcourir : il reçoit la devise d'accès.
 */
export function AppHeader() {
  const isAuthenticated = useAuthStore((s) => s.user !== null);

  return (
    <header className="app-header">
      {isAuthenticated ? <MemberHeading /> : <VisitorHeading />}
    </header>
  );
}

function MemberHeading() {
  return (
    <div className="flex min-w-0 items-center">
      <BrandMark />
      <div aria-hidden className="header-divider" />
      <AppBreadcrumb />
    </div>
  );
}

function VisitorHeading() {
  return (
    <>
      <BrandMark />
      <span className="eyebrow whitespace-nowrap">{VISITOR_TAGLINE}</span>
    </>
  );
}

/** La marque ramène à l'accueil, par la même garde de sortie que le fil. */
function BrandMark() {
  const onFollow = useGuardedFollow();

  return (
    <Link
      to={ROUTES.home}
      onClick={(event) => onFollow(event, ROUTES.home)}
      className="flex shrink-0 items-center gap-3"
    >
      <Diamond tone="filled" />
      <span className="wordmark">Donjons &amp; Dragons</span>
    </Link>
  );
}
