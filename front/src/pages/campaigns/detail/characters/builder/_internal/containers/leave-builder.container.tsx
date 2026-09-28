import { useParams } from "react-router-dom";
import { toCampaignDetailCharacters } from "@/shared/constants/routes";
import { useLeaveGuard } from "../hooks/use-leave-guard";
import { LeaveBuilderDialogView } from "../views/leave-builder-dialog.view";

export function LeaveBuilderContainer() {
  const { campaignId = "" } = useParams();
  const guard = useLeaveGuard();

  return (
    <LeaveBuilderDialogView
      leave={{ ...guard, backTo: toCampaignDetailCharacters(campaignId) }}
    />
  );
}
