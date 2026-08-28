import { Outlet, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/shared/components/atoms/button";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { OrnateCorners } from "@/shared/components/molecules/ornate-corners";
import { cn } from "@/shared/utils/utils";
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
}

export function ProfileLayoutView({ nav, identity }: ProfileLayoutViewProps) {
  return (
    <div className="flex min-h-0 flex-1 gap-4 p-5">
      <ProfileMenuButton onToggleMenu={nav.onToggleMenu} />

      <ProfileSidebar nav={nav} identity={identity} />

      <main className="panel min-w-0 flex-1">
        <OrnateCorners />
        <Outlet />
      </main>
    </div>
  );
}

function ProfileMenuButton({ onToggleMenu }: { onToggleMenu: () => void }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onToggleMenu}
      aria-label="Menu du profil"
      className="absolute top-20 left-4 z-50 md:hidden"
    >
      <Menu className="size-5" />
    </Button>
  );
}

function ProfileSidebar({ nav, identity }: ProfileLayoutViewProps) {
  return (
    <aside className={toSidebarClassName(nav.isMenuOpen)}>
      <SectionHeading label="Profil" />
      <nav role="navigation" className="flex flex-col gap-1.5">
        {nav.items.map((item) => (
          <ProfileNavEntry
            key={item.label}
            item={item}
            onNavigate={nav.onNavigate}
          />
        ))}
      </nav>
      <ProfileIdentityBlock identity={identity} />
    </aside>
  );
}

interface ProfileNavEntryProps {
  item: ProfileNavItem;
  onNavigate: () => void;
}

function ProfileNavEntry({ item, onNavigate }: ProfileNavEntryProps) {
  if (item.route === null) {
    return <InertNavEntry label={item.label} />;
  }

  return (
    <NavLink to={item.route} onClick={onNavigate} className={toNavEntryClassName}>
      {item.label}
    </NavLink>
  );
}

/** L'écran est annoncé mais pas encore ouvert : visible, jamais actionnable. */
function InertNavEntry({ label }: { label: string }) {
  return (
    <span aria-disabled className={cn(NAV_ENTRY_BASE, "border-gold/14 text-ink-disabled")}>
      {label}
    </span>
  );
}

function ProfileIdentityBlock({ identity }: { identity: ProfileIdentity }) {
  return (
    <div className="name-value mt-auto">
      <span className="text-body tracking-name text-gold-value">
        {identity.displayName}
      </span>
      <span className="muted-text-xs">{toCompanionsLabel(identity)}</span>
    </div>
  );
}

const NAV_ENTRY_BASE =
  "flex items-center justify-between gap-2.5 border px-3.5 py-2.5 font-display text-note tracking-meta";

function toSidebarClassName(isMenuOpen: boolean): string {
  return cn(
    "panel fixed z-40 flex w-[268px] shrink-0 flex-col gap-4 md:relative md:flex",
    isMenuOpen ? "flex" : "hidden",
  );
}

function toNavEntryClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    NAV_ENTRY_BASE,
    "selectable text-ink-idle",
    isActive && "selectable-on text-gold-selected",
  );
}

function toCompanionsLabel({ friendCount, pendingCount }: ProfileIdentity): string {
  const friends = `${friendCount} ${plural(friendCount, "ami")}`;
  if (pendingCount === 0) return friends;

  return `${friends} · ${pendingCount} ${plural(pendingCount, "demande")} en attente`;
}

function plural(count: number, word: string): string {
  return count > 1 ? `${word}s` : word;
}
