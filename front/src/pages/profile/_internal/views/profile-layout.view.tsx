import { Outlet, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button, buttonVariants } from "@/shared/components/atoms/button";
import { cn } from "@/shared/utils/utils";
import type { ProfileNavItem } from "../constants/profile-nav-items";

export interface ProfileLayoutViewProps {
  items: ProfileNavItem[];
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onNavigate: () => void;
}

export function ProfileLayoutView({
  items,
  isMenuOpen,
  onToggleMenu,
  onNavigate,
}: ProfileLayoutViewProps) {
  return (
    <div className="flex">
      <ProfileMenuButton onToggleMenu={onToggleMenu} />

      <ProfileSidebar
        items={items}
        isMenuOpen={isMenuOpen}
        onNavigate={onNavigate}
      />

      <main className="flex-1">
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
      className="md:hidden absolute top-20 left-4 z-50"
    >
      <Menu className="size-5" />
    </Button>
  );
}

interface ProfileSidebarProps {
  items: ProfileNavItem[];
  isMenuOpen: boolean;
  onNavigate: () => void;
}

function ProfileSidebar({ items, isMenuOpen, onNavigate }: ProfileSidebarProps) {
  return (
    <aside className={toSidebarClassName(isMenuOpen)}>
      <nav role="navigation" className="flex flex-col gap-1">
        {items.map((item) => (
          <ProfileNavLink key={item.route} item={item} onNavigate={onNavigate} />
        ))}
      </nav>
    </aside>
  );
}

interface ProfileNavLinkProps {
  item: ProfileNavItem;
  onNavigate: () => void;
}

function ProfileNavLink({ item, onNavigate }: ProfileNavLinkProps) {
  return (
    <NavLink to={item.route} onClick={onNavigate} className={toNavLinkClassName}>
      {item.label}
    </NavLink>
  );
}

function toSidebarClassName(isMenuOpen: boolean): string {
  return cn(
    "fixed md:relative md:block w-48 border-r border-sidebar-border bg-sidebar p-4",
    isMenuOpen ? "block" : "hidden",
    "md:block",
  );
}

function toNavLinkClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
    "w-full justify-start",
  );
}
