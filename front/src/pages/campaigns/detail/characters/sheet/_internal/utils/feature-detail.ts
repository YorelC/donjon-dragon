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

/** La ressource qu'une aptitude dépense, s'il y en a une : Rage, Mains guérisseuses… */
export function resourceOf(
  feature: ResolvedFeature,
  resources: readonly ResolvedResource[],
): ResolvedResource | undefined {
  return resources.find((entry) => entry.feature === feature.name);
}

export function toFeatureDetail(
  feature: ResolvedFeature,
  resources: ResolvedResource[],
): SheetDetail {
  const resource = resourceOf(feature, resources);

  return {
    name: feature.name,
    meta: [feature.source, ...toApplicationLabels(feature)].join(" · "),
    description: feature.description,
    lines: [...(resource ? [toResourceLine(resource)] : []), ...feature.notes],
  };
}

function toApplicationLabels(feature: ResolvedFeature): string[] {
  return [...new Set(feature.applications)].map((application) => APPLICATION_LABELS[application]);
}

function toResourceLine(resource: ResolvedResource): string {
  const recovery = toLabel(RECOVERY_LABELS, resource.recovery);
  return `Utilisable ${resource.max} fois, puis rechargée par un ${recovery}.`;
}
