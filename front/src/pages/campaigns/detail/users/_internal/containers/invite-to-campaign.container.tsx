import { useInviteToCampaignForm } from "../hooks/use-invite-to-campaign-form";
import { InviteToCampaignView } from "../views/invite-to-campaign.view";

interface InviteToCampaignContainerProps {
  campaignId: string;
}

export function InviteToCampaignContainer({
  campaignId,
}: InviteToCampaignContainerProps) {
  const invite = useInviteToCampaignForm(campaignId);

  return <InviteToCampaignView invite={invite} />;
}
