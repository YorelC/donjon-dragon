import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/atoms/tabs";
import { OrnateCorners } from "@/shared/components/molecules/ornate-corners";
import type { CampaignsTab } from "../hooks/use-campaigns-tabs";
import type { CampaignsCounts } from "../hooks/use-campaigns-counts";
import { CampaignInvitationsContainer } from "../containers/campaign-invitations.container";
import { CreateCampaignContainer } from "../containers/create-campaign.container";
import { InvitationCountBadgeContainer } from "../containers/invitation-count-badge.container";
import { MyCampaignsContainer } from "../containers/my-campaigns.container";

interface CampaignsViewProps {
  activeTab: CampaignsTab;
  onTabChange: (tab: CampaignsTab) => void;
  counts: CampaignsCounts;
}

/** La route n'a pas de layout : elle pose son propre panneau, comme le Profil. */
export function CampaignsView({
  activeTab,
  onTabChange,
  counts,
}: CampaignsViewProps) {
  return (
    <div className="p-5">
      <main className="panel flex min-w-0 flex-col gap-[22px]">
        <OrnateCorners />
        <CampaignsHeader counts={counts} />
        <Tabs
          value={activeTab}
          onValueChange={(tab) => onTabChange(tab as CampaignsTab)}
        >
          <CampaignsTabsList counts={counts} />
          <CampaignsTabsPanels />
        </Tabs>
      </main>
    </div>
  );
}

function CampaignsHeader({ counts }: { counts: CampaignsCounts }) {
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        <span className="eyebrow">{counts.campaigns} en cours</span>
        <h1 className="page-title mt-1.5">Campagnes</h1>
      </div>
      <CreateCampaignContainer />
    </div>
  );
}

function CampaignsTabsList({ counts }: { counts: CampaignsCounts }) {
  return (
    <TabsList variant="box">
      <CampaignsTabTrigger value="mine" label="Mes campagnes en cours">
        <TabCount count={counts.campaigns} />
      </CampaignsTabTrigger>
      <CampaignsTabTrigger value="invitations" label="Demandes de campagne">
        <InvitationCountBadgeContainer />
      </CampaignsTabTrigger>
    </TabsList>
  );
}

interface CampaignsTabTriggerProps {
  value: CampaignsTab;
  label: string;
  children: React.ReactNode;
}

function CampaignsTabTrigger({
  value,
  label,
  children,
}: CampaignsTabTriggerProps) {
  return (
    <TabsTrigger value={value}>
      {label}
      {children}
    </TabsTrigger>
  );
}

/** Un décompte nul ne mérite pas d'être affiché : la liste vide le dira. */
function TabCount({ count }: { count: number }) {
  if (count === 0) return null;

  return <span className="muted-text-xs">{count}</span>;
}

function CampaignsTabsPanels() {
  return (
    <>
      <TabsContent value="mine" className="mt-4">
        <MyCampaignsContainer />
      </TabsContent>
      <TabsContent value="invitations" className="mt-4">
        <CampaignInvitationsContainer />
      </TabsContent>
    </>
  );
}
