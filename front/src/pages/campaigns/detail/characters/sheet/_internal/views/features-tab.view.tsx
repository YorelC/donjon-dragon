import type { ResolvedFeature, ResolvedResource } from "@donjon-dragon/shared";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { cn } from "@/shared/utils/utils";
import type { HoverBinding } from "../types/hover-binding";
import { featureKey, isActive, sortFeatures, toFeatureDetail } from "../utils/feature-detail";
import { SheetDetailAsideView } from "./sheet-detail-aside.view";

interface FeaturesTabViewProps {
  features: ResolvedFeature[];
  resources: ResolvedResource[];
  hover: HoverBinding<ResolvedFeature>;
}

const HINT =
  "Survolez une aptitude pour sa description. Les aptitudes actives sont en tête de liste, les passifs en dessous.";

export function FeaturesTabView({ features, resources, hover }: FeaturesTabViewProps) {
  const { actives, passives } = sortFeatures(features);

  return (
    <div className="sheet-tab-split">
      <div className="flex min-w-0 flex-col gap-[11px]">
        <SectionHeading label="Aptitudes" />
        <ul className="flex flex-col gap-[5px]">
          <FeatureRows features={actives} hover={hover} />
          <PassivesDivider />
          <FeatureRows features={passives} hover={hover} />
        </ul>
      </div>
      <SheetDetailAsideView
        title="Détail"
        hint={HINT}
        detail={hover.current ? toFeatureDetail(hover.current, resources) : null}
      />
    </div>
  );
}

interface FeatureRowsProps {
  features: ResolvedFeature[];
  hover: HoverBinding<ResolvedFeature>;
}

function FeatureRows({ features, hover }: FeatureRowsProps) {
  return (
    <>
      {features.map((feature) => (
        <FeatureRow key={featureKey(feature)} feature={feature} hover={hover} />
      ))}
    </>
  );
}

function PassivesDivider() {
  return (
    <li aria-hidden className="flex items-center gap-2.5 pt-3 pb-1">
      <span className="sheet-tag tracking-section">Passifs</span>
      <div className="h-px flex-1 bg-gold/14" />
    </li>
  );
}

interface FeatureRowProps {
  feature: ResolvedFeature;
  hover: HoverBinding<ResolvedFeature>;
}

function FeatureRow({ feature, hover }: FeatureRowProps) {
  const active = isActive(feature);

  return (
    <li
      tabIndex={0}
      onMouseEnter={() => hover.onEnter(feature)}
      onMouseLeave={hover.onLeave}
      onFocus={() => hover.onEnter(feature)}
      onBlur={hover.onLeave}
      className={cn(
        "sheet-row grid cursor-help grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-[9px] py-[9px]",
        !active && "border-gold/10",
      )}
    >
      <Diamond size="tick" tone={active ? "filled" : "active"} />
      <span className={cn("min-w-0 text-sm/[1.4]", active ? "text-gold-value" : "text-ink-idle")}>
        {feature.name}
      </span>
      <span className="sheet-tag">{feature.source}</span>
    </li>
  );
}
