import { Link } from "react-router-dom";
import { Diamond } from "@/shared/components/molecules/diamond";
import { ROUTES } from "@/shared/constants/routes";
import { AppBreadcrumb } from "@/shared/components/layout/breadcrumb.container";
import { useGuardedFollow, type FollowHandler } from "@/shared/hooks/use-guarded-follow";
import { useAuthStore } from "@/shared/stores/auth.store";

const VISITOR_TAGLINE = "Accès à votre table";

/**
 * Bandeau de tête, présent sur toute page : la marque, puis le fil d'Ariane. Les
 * écrans voisins sont dans la barre latérale ; le bandeau dit seulement où l'on
 * est. Un visiteur n'a rien à parcourir : il reçoit la devise d'accès.
 */
export function AppHeader() {
  const isAuthenticated = useAuthStore((s) => s.user !== null);
  const onFollow = useGuardedFollow();

  return (
    <header className="app-header">
      {isAuthenticated ? (
        <MemberHeading onFollow={onFollow} />
      ) : (
        <VisitorHeading onFollow={onFollow} />
      )}
    </header>
  );
}

interface HeadingProps {
  onFollow: FollowHandler;
}

function MemberHeading({ onFollow }: HeadingProps) {
  return (
    <div className="flex min-w-0 items-center">
      <BrandMark onFollow={onFollow} />
      <div aria-hidden className="header-divider" />
      <AppBreadcrumb />
    </div>
  );
}

function VisitorHeading({ onFollow }: HeadingProps) {
  return (
    <>
      <BrandMark onFollow={onFollow} />
      <span className="eyebrow whitespace-nowrap">{VISITOR_TAGLINE}</span>
    </>
  );
}

/** La marque ramène à l'accueil, par la même garde de sortie que le fil. */
function BrandMark({ onFollow }: HeadingProps) {
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
