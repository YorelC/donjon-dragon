import { useLogout } from "@/shared/hooks/use-logout";
import { useProfileNav } from "../hooks/use-profile-nav";
import { useProfileIdentity } from "../hooks/use-profile-identity";
import { ProfileLayoutView } from "../views/profile-layout.view";

export function ProfileLayoutContainer() {
  const { items, isMenuOpen, toggleMenu, closeMenu } = useProfileNav();
  const identity = useProfileIdentity();
  const onLogout = useLogout();

  return (
    <ProfileLayoutView
      nav={{ items, isMenuOpen, onToggleMenu: toggleMenu, onNavigate: closeMenu }}
      identity={identity}
      onLogout={onLogout}
    />
  );
}
