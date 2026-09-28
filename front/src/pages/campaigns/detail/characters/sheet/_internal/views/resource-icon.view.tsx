import type { ReactNode } from "react";
import { Diamond } from "@/shared/components/molecules/diamond";
import {
  RESOURCE_KEYS,
  isIllustratedResource,
  type IllustratedResource,
} from "../constants/resource-styles";

const RESOURCE_ICONS: Record<IllustratedResource, () => JSX.Element> = {
  [RESOURCE_KEYS.bardicInspiration]: LyreIcon,
  [RESOURCE_KEYS.secondWind]: SwordIcon,
  [RESOURCE_KEYS.rage]: AxeIcon,
};

/**
 * L'emblème d'une ressource de classe, dans la teinte du texte qui l'entoure.
 * Une ressource sans emblème garde le losange, seule icône de la charte.
 */
export function ResourceIconView({ resourceKey }: { resourceKey: string }) {
  if (!isIllustratedResource(resourceKey)) return <Diamond size="box" tone="active" />;
  const Icon = RESOURCE_ICONS[resourceKey];

  return <Icon />;
}

function LyreIcon() {
  return (
    <ResourceSvg>
      <path d="M6 3.5C3.8 7.5 4.6 11.8 8 14M18 3.5c2.2 4 1.4 8.3-2 10.5" />
      <path d="M5.5 5.5h13" />
      <path d="M8 14h8v3.5a2.5 2.5 0 0 1-2.5 2.5h-3A2.5 2.5 0 0 1 8 17.5Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M10 5.5V14M12 5.5V14M14 5.5V14" strokeWidth="1" />
    </ResourceSvg>
  );
}

function SwordIcon() {
  return (
    <ResourceSvg>
      <path d="M12 2l2 3v9.5h-4V5Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M6.5 14.5h11" />
      <path d="M12 14.5v5" />
      <circle cx="12" cy="21" r="1.2" fill="currentColor" />
    </ResourceSvg>
  );
}

function AxeIcon() {
  return (
    <ResourceSvg>
      <path d="M5 21 16.5 6" />
      <path d="M13.5 4.2c3.8-2.4 8 .4 7.4 5.8-2.3-1.3-4.4-1.6-6.4-1.2Z" fill="currentColor" fillOpacity="0.25" />
      <path d="M13 4.6 11.2 7l3.3 2.4 1.7-2.3" />
    </ResourceSvg>
  );
}

function ResourceSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-[22px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}
