import type { ResolvedFeature, ResolvedResource } from "@donjon-dragon/shared";
import { useHoveredEntry } from "../hooks/use-hovered-entry";
import { FeaturesTabView } from "../views/features-tab.view";

interface FeaturesTabContainerProps {
  features: ResolvedFeature[];
  resources: ResolvedResource[];
}

export function FeaturesTabContainer({ features, resources }: FeaturesTabContainerProps) {
  const hover = useHoveredEntry<ResolvedFeature>();

  return <FeaturesTabView features={features} resources={resources} hover={hover} />;
}
