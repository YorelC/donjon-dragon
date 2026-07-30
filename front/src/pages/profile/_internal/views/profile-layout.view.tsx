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
      <Button
        variant="outline"
        size="icon"
        onClick={onToggleMenu}
        className="md:hidden absolute top-20 left-4 z-50"
      >
        <Menu className="size-5" />
      </Button>

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

function ProfileSidebar({
  items,
  isMenuOpen,
  onNavigate,
}: {
  items: ProfileNavItem[];
  isMenuOpen: boolean;
  onNavigate: () => void;
}) {
  return (
    <aside
      className={cn(
        "fixed md:relative md:block w-48 border-r border-sidebar-border bg-sidebar p-4",
        isMenuOpen ? "block" : "hidden",
        "md:block"
      )}
    >
      <nav role="navigation" className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.route}
            to={item.route}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
                "w-full justify-start"
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
