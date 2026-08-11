import { Link, NavLink, Outlet } from "react-router-dom";
import type { CampaignDetail } from "@donjon-dragon/shared";
import { buttonVariants } from "@/shared/components/atoms/button";
import { ROUTES } from "@/shared/constants/routes";
import type { QueryState } from "@/shared/types/ui-state";
import { cn } from "@/shared/utils/utils";
import type { CampaignDetailNavItem } from "../constants/campaign-detail-nav-items";

interface CampaignDetailLayoutViewProps {
  campaign: QueryState<CampaignDetail | null>;
  items: CampaignDetailNavItem[];
}

export function CampaignDetailLayoutView({
  campaign,
  items,
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
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <CampaignDetailHeader campaign={campaign.data} />
      <div className="flex gap-6">
        <CampaignDetailSidebar items={items} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function CampaignDetailHeader({ campaign }: { campaign: CampaignDetail }) {
  return (
    <header className="space-y-2">
      <Link to={ROUTES.campaigns} className="muted-text-xs hover:underline">
        ← Toutes mes campagnes
      </Link>
      <h1 className="section-title text-2xl">{campaign.name}</h1>
    </header>
  );
}

function CampaignDetailSidebar({ items }: { items: CampaignDetailNavItem[] }) {
  return (
    <aside className="w-48 shrink-0 border-r border-sidebar-border pr-4">
      <nav role="navigation" className="flex flex-col gap-1">
        {items.map((item) => (
          <CampaignDetailNavLink key={item.route} item={item} />
        ))}
      </nav>
    </aside>
  );
}

function CampaignDetailNavLink({ item }: { item: CampaignDetailNavItem }) {
  return (
    <NavLink to={item.route} className={toNavLinkClassName}>
      {item.label}
    </NavLink>
  );
}

function toNavLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
    "w-full justify-start",
  );
}
