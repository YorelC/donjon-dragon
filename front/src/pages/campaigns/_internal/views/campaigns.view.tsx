import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/atoms/tabs";
import type { CampaignsTab } from "../hooks/use-campaigns-tabs";
import { CampaignInvitationsContainer } from "../containers/campaign-invitations.container";
import { CreateCampaignContainer } from "../containers/create-campaign.container";
import { InvitationCountBadgeContainer } from "../containers/invitation-count-badge.container";
import { MyCampaignsContainer } from "../containers/my-campaigns.container";

interface CampaignsViewProps {
  activeTab: CampaignsTab;
  onTabChange: (tab: CampaignsTab) => void;
}

export function CampaignsView({ activeTab, onTabChange }: CampaignsViewProps) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <CampaignsHeader />
      <Tabs
        value={activeTab}
        onValueChange={(tab) => onTabChange(tab as CampaignsTab)}
      >
        <CampaignsTabsList />
        <CampaignsTabsPanels />
      </Tabs>
    </div>
  );
}

function CampaignsHeader() {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="section-title text-2xl">Campagnes</h1>
      <CreateCampaignContainer />
    </div>
  );
}

function CampaignsTabsList() {
  return (
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="mine">Mes campagnes en cours</TabsTrigger>
      <TabsTrigger value="invitations" className="gap-2">
        Demandes de campagne
        <InvitationCountBadgeContainer />
      </TabsTrigger>
    </TabsList>
  );
}

function CampaignsTabsPanels() {
  return (
    <>
      <TabsContent value="mine" className="mt-6">
        <MyCampaignsContainer />
      </TabsContent>
      <TabsContent value="invitations" className="mt-6">
        <CampaignInvitationsContainer />
      </TabsContent>
    </>
  );
}
