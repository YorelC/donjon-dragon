import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/atoms/tabs";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SHEET_TABS } from "../constants/sheet-labels";
import { FeaturesTabContainer } from "../containers/features-tab.container";
import { WeaponsTabContainer } from "../containers/weapons-tab.container";
import type { CharacterSheetModel } from "../types/character-sheet-model";
import { GearTabView } from "./gear-tab.view";
import { GrimoireTabView } from "./grimoire-tab.view";
import { IdentityTabView } from "./identity-tab.view";

type SheetTab = (typeof SHEET_TABS)[keyof typeof SHEET_TABS];

/** Le détail de la fiche, rangé par usage : se battre, agir, lancer, porter, être. */
export function SheetTabsView({ model }: { model: CharacterSheetModel }) {
  const { sheet } = model;
  const hasSpellcasting = sheet.spellcasting.length > 0;

  return (
    <Tabs
      defaultValue={SHEET_TABS.weapons.value}
      className="panel-flat min-w-0 gap-0 bg-white/[.012]"
    >
      <TabsList variant="panel" className="overflow-x-auto px-[22px]">
        <SheetTabTrigger tab={SHEET_TABS.weapons} />
        <SheetTabTrigger tab={SHEET_TABS.features} />
        {hasSpellcasting ? <SheetTabTrigger tab={SHEET_TABS.grimoire} /> : null}
        <SheetTabTrigger tab={SHEET_TABS.gear} />
        <SheetTabTrigger tab={SHEET_TABS.identity} />
      </TabsList>
      <div className="min-w-0 px-[22px] pt-6 pb-[26px]">
        <TabsContent value={SHEET_TABS.weapons.value}>
          <WeaponsTabContainer attacks={sheet.attacks} />
        </TabsContent>
        <TabsContent value={SHEET_TABS.features.value}>
          <FeaturesTabContainer features={sheet.features} resources={sheet.resources} />
        </TabsContent>
        {hasSpellcasting ? (
          <TabsContent value={SHEET_TABS.grimoire.value}>
            <GrimoireTabView sheet={sheet} />
          </TabsContent>
        ) : null}
        <TabsContent value={SHEET_TABS.gear.value}>
          <GearTabView equipment={sheet.equipment} />
        </TabsContent>
        <TabsContent value={SHEET_TABS.identity.value}>
          <IdentityTabView model={model} />
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
