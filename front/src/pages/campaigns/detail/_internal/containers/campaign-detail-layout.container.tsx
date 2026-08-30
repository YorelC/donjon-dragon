import { useParams } from "react-router-dom";
import { useCampaignDetail } from "@/shared/queries/use-campaign-detail";
import { useCampaignDetailNav } from "../hooks/use-campaign-detail-nav";
import {
  CampaignDetailLayoutView,
  type CampaignDetailNavigation,
} from "../views/campaign-detail-layout.view";

export function CampaignDetailLayoutContainer() {
  const { campaignId = "" } = useParams();
  const detailQuery = useCampaignDetail(campaignId);
  const nav = useCampaignDetailNav(campaignId);

  return (
    <CampaignDetailLayoutView
      campaign={{
        data: detailQuery.data ?? null,
        loading: detailQuery.isLoading,
        error: detailQuery.isError,
      }}
      nav={toNavigation(nav)}
    />
  );
}

function toNavigation(
  nav: ReturnType<typeof useCampaignDetailNav>,
): CampaignDetailNavigation {
  return {
    items: nav.items,
    isMenuOpen: nav.isMenuOpen,
    onToggleMenu: nav.toggleMenu,
    onNavigate: nav.closeMenu,
  };
}
