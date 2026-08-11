import { useCreateCampaignForm } from "../hooks/use-create-campaign-form";
import { CreateCampaignView } from "../views/create-campaign.view";

export function CreateCampaignContainer() {
  const { open, onOpenChange, form } = useCreateCampaignForm();

  return <CreateCampaignView open={open} onOpenChange={onOpenChange} form={form} />;
}
