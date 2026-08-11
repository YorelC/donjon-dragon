import type { CampaignDetail } from "@donjon-dragon/shared";
import { CampaignExitContainer } from "../containers/campaign-exit.container";
import { CampaignMembersContainer } from "../containers/campaign-members.container";
import { InviteToCampaignContainer } from "../containers/invite-to-campaign.container";

interface CampaignUsersViewProps {
  campaign: CampaignDetail;
}

export function CampaignUsersView({ campaign }: CampaignUsersViewProps) {
  return (
    <section className="space-y-6">
      <GameMasterActions campaign={campaign} />
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
