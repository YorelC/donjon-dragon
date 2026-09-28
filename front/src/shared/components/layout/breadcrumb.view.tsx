import { Link } from "react-router-dom";
import type { FollowHandler } from "@/shared/hooks/use-guarded-follow";
import type { Crumb } from "@/shared/utils/breadcrumb-trails";

interface BreadcrumbViewProps {
  trail: Crumb[];
  onFollow: FollowHandler;
}

const TRAIL_LABEL = "Fil d'Ariane";

/**
 * D'où l'on vient, jusqu'à la page ouverte. Chaque étape mène à son écran, sauf
 * la dernière : on y est. Il remplace les liens de retour des pages.
 */
export function BreadcrumbView({ trail, onFollow }: BreadcrumbViewProps) {
  const current = trail[trail.length - 1];
  if (!current) return null;

  return (
    <nav aria-label={TRAIL_LABEL} className="min-w-0">
      <ol className="breadcrumb">
        {trail.slice(0, -1).map((crumb) => (
          <PassedCrumb key={`${crumb.label}-${crumb.to}`} crumb={crumb} onFollow={onFollow} />
        ))}
        <CurrentCrumb crumb={current} />
      </ol>
    </nav>
  );
}

interface PassedCrumbProps {
  crumb: Crumb;
  onFollow: FollowHandler;
}

function PassedCrumb({ crumb, onFollow }: PassedCrumbProps) {
  return (
    <li className="breadcrumb-step">
      <Link
        to={crumb.to}
        title={crumb.label}
        onClick={(event) => onFollow(event, crumb.to)}
        className="crumb-link"
      >
        {crumb.label}
      </Link>
      <span aria-hidden className="crumb-chevron" />
    </li>
  );
}

function CurrentCrumb({ crumb }: { crumb: Crumb }) {
  return (
    <li className="breadcrumb-step">
      <span aria-current="page" title={crumb.label} className="crumb-current">
        {crumb.label}
      </span>
    </li>
  );
}
