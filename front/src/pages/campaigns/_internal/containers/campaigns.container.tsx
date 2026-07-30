import { useAuthStore } from "@/shared/stores/auth.store";
import { CampaignsView } from "../views/campaigns.view";

export function CampaignsContainer() {
  const displayName = useAuthStore((s) => s.user?.displayName ?? "");

  return <CampaignsView displayName={displayName} />;
}
