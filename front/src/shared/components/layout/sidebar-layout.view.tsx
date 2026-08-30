import { Outlet, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/shared/components/atoms/button";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { OrnateCorners } from "@/shared/components/molecules/ornate-corners";
import { cn } from "@/shared/utils/utils";

export interface SidebarNavItem {
  label: string;
  /** `null` : jalon inerte, l'écran est annoncé mais pas encore ouvert. */
  route: string | null;
}

export interface SidebarNav {
  /** Intitulé de la barre : ce dont on navigue les écrans. */
  heading: string;
  menuLabel: string;
  items: SidebarNavItem[];
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}

/** Le pied de barre : qui l'on est ici, et l'état de ce qui nous entoure. */
export interface SidebarFooter {
  title: string;
  subtitle: string;
}

interface SidebarLayoutViewProps {
  nav: SidebarNav;
  footer: SidebarFooter;
}

/**
 * Le cadre à deux colonnes de la charte : une barre latérale en panneau doré, un
 * panneau de premier plan à équerres pour l'écran ouvert. Profil et campagne le
 * partagent — ce sont deux navigations, pas deux mises en page.
 */
export function SidebarLayoutView({ nav, footer }: SidebarLayoutViewProps) {
  return (
    <div className="flex min-h-0 flex-1 gap-4 p-5">
      <SidebarMenuButton nav={nav} />
      <Sidebar nav={nav} footer={footer} />
      <main className="panel-surface relative flex min-w-0 flex-1 flex-col">
        <OrnateCorners />
        <div className="panel-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function SidebarMenuButton({ nav }: { nav: SidebarNav }) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={nav.onToggle}
      aria-label={nav.menuLabel}
      className="absolute top-20 left-4 z-50 md:hidden"
    >
      <Menu className="size-5" />
    </Button>
  );
}

function Sidebar({ nav, footer }: SidebarLayoutViewProps) {
  return (
    <aside className={toSidebarClassName(nav.isOpen)}>
      <SectionHeading label={nav.heading} />
      <nav role="navigation" className="flex flex-col gap-1.5">
        {nav.items.map((item) => (
          <SidebarEntry key={item.label} item={item} onNavigate={nav.onNavigate} />
        ))}
      </nav>
      <SidebarFooterBlock footer={footer} />
    </aside>
  );
}

interface SidebarEntryProps {
  item: SidebarNavItem;
  onNavigate: () => void;
}

function SidebarEntry({ item, onNavigate }: SidebarEntryProps) {
  if (item.route === null) {
    return <InertEntry label={item.label} />;
  }

  return (
    <NavLink to={item.route} onClick={onNavigate} className={toEntryClassName}>
      {item.label}
    </NavLink>
  );
}

/** L'écran est annoncé mais pas encore ouvert : visible, jamais actionnable. */
function InertEntry({ label }: { label: string }) {
  return (
    <span aria-disabled className={cn(ENTRY_BASE, "border-gold/14 text-ink-disabled")}>
      {label}
    </span>
  );
}

function SidebarFooterBlock({ footer }: { footer: SidebarFooter }) {
  return (
    <div className="name-value mt-auto">
      <span className="text-body tracking-name text-gold-value">
        {footer.title}
      </span>
      <span className="muted-text-xs">{footer.subtitle}</span>
    </div>
  );
}

const ENTRY_BASE =
  "flex items-center justify-between gap-2.5 border px-3.5 py-2.5 font-display text-note tracking-meta";

function toSidebarClassName(isOpen: boolean): string {
  return cn(
    "panel fixed z-40 w-[268px] shrink-0 flex-col gap-4 md:relative md:flex",
    isOpen ? "flex" : "hidden",
  );
}

function toEntryClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    ENTRY_BASE,
    "selectable text-ink-idle",
    isActive && "selectable-on text-gold-selected",
  );
}
