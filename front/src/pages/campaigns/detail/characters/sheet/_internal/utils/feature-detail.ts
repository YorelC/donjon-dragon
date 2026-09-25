import type { ResolvedFeature, ResolvedResource } from "@donjon-dragon/shared";
import {
  ACTIVE_APPLICATIONS,
  APPLICATION_LABELS,
  RECOVERY_LABELS,
} from "../constants/sheet-labels";
import type { SheetDetail } from "../types/sheet-detail";
import { toLabel } from "./sheet-format";

export interface SortedFeatures {
  actives: ResolvedFeature[];
  passives: ResolvedFeature[];
}

/** Ce qui se déclenche en tête, ce qui s'applique seul en dessous — l'ordre de la maquette. */
export function sortFeatures(features: ResolvedFeature[]): SortedFeatures {
  return {
    actives: features.filter(isActive),
    passives: features.filter((feature) => !isActive(feature)),
  };
}

export function isActive(feature: ResolvedFeature): boolean {
  return feature.applications.some((application) => ACTIVE_APPLICATIONS.includes(application));
}

export function featureKey(feature: ResolvedFeature): string {
  return `${feature.sourceType}:${feature.source}:${feature.name}`;
}

export function toFeatureDetail(
  feature: ResolvedFeature,
  resources: ResolvedResource[],
): SheetDetail {
  const resource = resources.find((entry) => entry.feature === feature.name);

  return {
    name: feature.name,
    meta: [feature.source, ...toApplicationLabels(feature)].join(" · "),
    lines: [...feature.notes, ...(resource ? [toResourceLine(resource)] : [])],
  };
}

function toApplicationLabels(feature: ResolvedFeature): string[] {
  return [...new Set(feature.applications)].map((application) => APPLICATION_LABELS[application]);
}

function toResourceLine(resource: ResolvedResource): string {
  return `${resource.max} utilisation(s), récupérées au ${toLabel(RECOVERY_LABELS, resource.recovery)}.`;
}
