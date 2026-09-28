import type { ResolvedFeature, ResolvedResource } from "@donjon-dragon/shared";
import { Diamond } from "@/shared/components/molecules/diamond";
import { SectionHeading } from "@/shared/components/molecules/section-heading";
import { cn } from "@/shared/utils/utils";
import type { HoverBinding } from "../types/hover-binding";
import { resourceToneOf } from "../constants/resource-styles";
import { RECOVERY_LABELS } from "../constants/sheet-labels";
import {
  featureKey,
  isActive,
  resourceOf,
  sortFeatures,
  toFeatureDetail,
} from "../utils/feature-detail";
import { toLabel } from "../utils/sheet-format";
import { ResourceIconView } from "./resource-icon.view";
import { ResourceUsesView } from "./resource-uses.view";
import { SheetDetailAsideView } from "./sheet-detail-aside.view";

interface FeaturesTabViewProps {
  features: ResolvedFeature[];
  resources: ResolvedResource[];
  hover: HoverBinding<ResolvedFeature>;
}

const HINT =
  "Survolez une aptitude pour savoir ce qu'elle fait. Les actives sont en tête ; celles qui s'épuisent portent leurs utilisations et le repos qui les recharge. Les passifs s'appliquent seuls, en dessous.";

export function FeaturesTabView({ features, resources, hover }: FeaturesTabViewProps) {
  const { actives, passives } = sortFeatures(features);

  return (
    <div className="sheet-tab-split">
      <div className="flex min-w-0 flex-col gap-[11px]">
        <SectionHeading label="Aptitudes" />
        <ul className="flex flex-col gap-[5px]">
          <FeatureRows features={actives} resources={resources} hover={hover} />
          <PassivesDivider />
          <FeatureRows features={passives} resources={resources} hover={hover} />
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

type FeatureRowsProps = FeaturesTabViewProps;

function FeatureRows({ features, resources, hover }: FeatureRowsProps) {
  return (
    <>
      {features.map((feature) => (
        <FeatureRow
          key={featureKey(feature)}
          feature={feature}
          resource={resourceOf(feature, resources)}
          hover={hover}
        />
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
  resource: ResolvedResource | undefined;
  hover: HoverBinding<ResolvedFeature>;
}

/** Une aptitude qui s'épuise porte son emblème et ses utilisations sur sa propre ligne. */
function FeatureRow({ feature, resource, hover }: FeatureRowProps) {
  const active = isActive(feature);

  return (
    <li
      tabIndex={0}
      onMouseEnter={() => hover.onEnter(feature)}
      onMouseLeave={hover.onLeave}
      onFocus={() => hover.onEnter(feature)}
      onBlur={hover.onLeave}
      data-resource={resource?.key}
      className={cn(
        "sheet-row grid cursor-help grid-cols-[22px_minmax(0,1fr)_auto_auto] items-center gap-[9px] py-[9px]",
        !active && "border-gold/10",
        resource && resourceToneOf(resource.key),
      )}
    >
      <FeatureMark feature={feature} resource={resource} />
      <span className={cn("min-w-0 text-sm/[1.4]", active ? "text-gold-value" : "text-ink-idle")}>
        {feature.name}
      </span>
      {resource ? <ResourceUsesView resource={resource} /> : <span />}
      <span className="sheet-tag">{toFeatureTag(feature, resource)}</span>
    </li>
  );
}

function FeatureMark({ feature, resource }: Omit<FeatureRowProps, "hover">) {
  if (resource) return <ResourceIconView resourceKey={resource.key} />;

  return (
    <span className="flex justify-center">
      <Diamond size="tick" tone={isActive(feature) ? "filled" : "active"} />
    </span>
  );
}

/** La source, et pour une aptitude qui s'épuise, le repos qui la recharge. */
function toFeatureTag(feature: ResolvedFeature, resource: ResolvedResource | undefined): string {
  if (!resource) return feature.source;
  return `${feature.source} · ${toLabel(RECOVERY_LABELS, resource.recovery)}`;
}
