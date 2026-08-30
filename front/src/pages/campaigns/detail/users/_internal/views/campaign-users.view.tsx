import type { CampaignDetail } from "@donjon-dragon/shared";
import { PageHeader } from "@/shared/components/molecules/page-header";
import { ROUTES } from "@/shared/constants/routes";
import { CampaignExitContainer } from "../containers/campaign-exit.container";
import { CampaignMembersContainer } from "../containers/campaign-members.container";
import { InviteToCampaignContainer } from "../containers/invite-to-campaign.container";

interface CampaignUsersViewProps {
  campaign: CampaignDetail;
}

const BACK_TO_CAMPAIGNS = {
  to: ROUTES.campaigns,
  label: "Toutes mes campagnes",
};

export function CampaignUsersView({ campaign }: CampaignUsersViewProps) {
  return (
    <section className="flex flex-col gap-6">
      <PageHeader back={BACK_TO_CAMPAIGNS} title={campaign.name}>
        <GameMasterActions campaign={campaign} />
      </PageHeader>
      <CampaignMembersContainer />
      <CampaignExitContainer />
    </section>
  );
}

/** Inviter est réservé au maître du jeu : le back refuse, l'UI ne le propose pas. */
function GameMasterActions({ campaign }: { campaign: CampaignDetail }) {
  if (campaign.myRole !== "gameMaster") return null;

  return <InviteToCampaignContainer campaignId={campaign.id} />;
}
