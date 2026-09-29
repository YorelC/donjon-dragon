import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/atoms/tabs";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SHEET_TABS } from "../constants/sheet-labels";
import { FeaturesTabContainer } from "../containers/features-tab.container";
import { GearTabContainer } from "../containers/gear-tab.container";
import { GrimoireTabContainer } from "../containers/grimoire-tab.container";
import { JournalTabContainer } from "../containers/journal-tab.container";
import { WeaponsTabContainer } from "../containers/weapons-tab.container";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { IdentityTabView } from "./identity-tab.view";

type SheetTab = (typeof SHEET_TABS)[keyof typeof SHEET_TABS];

/** Le détail de la fiche, rangé par usage : se battre, agir, lancer, porter, être, se souvenir. */
export function SheetTabsView({ model }: { model: CharacterSheetModel }) {
  const { sheet } = model;
  const hasSpellcasting = sheet.spellcasting.length > 0;

  return (
    <Tabs
      defaultValue={SHEET_TABS.weapons.value}
      className="panel-flat min-w-0 gap-0 bg-white/[.012] lg:min-h-0"
    >
      <TabsList variant="panel" className="justify-start overflow-x-auto px-[22px]">
        <SheetTabTrigger tab={SHEET_TABS.weapons} />
        <SheetTabTrigger tab={SHEET_TABS.features} />
        {hasSpellcasting ? <SheetTabTrigger tab={SHEET_TABS.grimoire} /> : null}
        <SheetTabTrigger tab={SHEET_TABS.gear} />
        <SheetTabTrigger tab={SHEET_TABS.identity} />
        <SheetTabTrigger tab={SHEET_TABS.journal} />
      </TabsList>
      <div className="min-w-0 px-[22px] pt-6 pb-[26px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
        <TabsContent value={SHEET_TABS.weapons.value} className="xl:h-full">
          <WeaponsTabContainer attacks={sheet.attacks} />
        </TabsContent>
        <TabsContent value={SHEET_TABS.features.value} className="xl:h-full">
          <FeaturesTabContainer features={sheet.features} resources={sheet.resources} />
        </TabsContent>
        {hasSpellcasting ? (
          <TabsContent value={SHEET_TABS.grimoire.value} className="xl:h-full">
            <GrimoireTabContainer sheet={sheet} />
          </TabsContent>
        ) : null}
        <TabsContent value={SHEET_TABS.gear.value} className="xl:h-full">
          <GearTabContainer equipment={sheet.equipment} />
        </TabsContent>
        <TabsContent value={SHEET_TABS.identity.value} className="xl:h-full">
          <IdentityTabView model={model} />
        </TabsContent>
        <TabsContent value={SHEET_TABS.journal.value} className="xl:h-full">
          <JournalTabContainer />
        </TabsContent>
      </div>
    </Tabs>
  );
}

/** Le losange plein ne se montre que sur l'onglet ouvert, comme dans la maquette. */
function SheetTabTrigger({ tab }: { tab: SheetTab }) {
  return (
    <TabsTrigger
      value={tab.value}
      className="group/sheet-tab flex-none gap-[9px] px-[18px] pt-[18px] pb-4 text-note data-[state=active]:bg-none"
    >
      <span className="hidden group-data-[state=active]/sheet-tab:block">
        <Diamond size="tick" tone="filled" />
      </span>
      {tab.label}
    </TabsTrigger>
  );
}
