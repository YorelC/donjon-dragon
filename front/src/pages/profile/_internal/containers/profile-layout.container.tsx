import { useProfileNav } from "../hooks/use-profile-nav";
import { ProfileLayoutView } from "../views/profile-layout.view";

export function ProfileLayoutContainer() {
  const { items, isMenuOpen, toggleMenu, closeMenu } = useProfileNav();

  return (
    <ProfileLayoutView
      items={items}
      isMenuOpen={isMenuOpen}
      onToggleMenu={toggleMenu}
      onNavigate={closeMenu}
    />
  );
}
