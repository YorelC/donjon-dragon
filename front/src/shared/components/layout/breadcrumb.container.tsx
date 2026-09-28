import { useRoutes, type RouteObject } from "react-router-dom";
import { useCampaignRef, useCharacterRef } from "@/shared/hooks/use-breadcrumb-refs";
import { useGuardedFollow } from "@/shared/hooks/use-guarded-follow";
import { ROUTES } from "@/shared/constants/routes";
import {
  CAMPAIGNS_TRAIL,
  FRIENDS_TRAIL,
  SETTINGS_TRAIL,
  toCampaignTrail,
  toCampaignUsersTrail,
  toCharacterCreationTrail,
  toCharacterEditTrail,
  toCharacterSheetTrail,
  type CampaignTrail,
  type CharacterTrail,
  type Crumb,
} from "@/shared/utils/breadcrumb-trails";
import { BreadcrumbView } from "./breadcrumb.view";

/** Toute autre route — accueil, vérification d'email — n'a pas de fil. */
const NO_TRAIL = "*";

/**
 * Le bandeau vit hors des routes des pages : il pose donc sa propre table, que
 * react-router matche comme l'autre. Chaque route ne charge que les noms dont
 * son fil a besoin.
 */
const BREADCRUMB_ROUTES: RouteObject[] = [
  { path: ROUTES.campaigns, element: <GuardedBreadcrumb trail={CAMPAIGNS_TRAIL} /> },
  { path: ROUTES.profileFriends, element: <GuardedBreadcrumb trail={FRIENDS_TRAIL} /> },
  { path: ROUTES.profileSettings, element: <GuardedBreadcrumb trail={SETTINGS_TRAIL} /> },
  {
    path: ROUTES.campaignDetailCharacters,
    element: <CampaignBreadcrumbContainer toTrail={toCampaignTrail} />,
  },
  {
    path: ROUTES.campaignDetailUsers,
    element: <CampaignBreadcrumbContainer toTrail={toCampaignUsersTrail} />,
  },
  {
    path: ROUTES.campaignCharacterNew,
    element: <CampaignBreadcrumbContainer toTrail={toCharacterCreationTrail} />,
  },
  {
    path: ROUTES.campaignCharacterSheet,
    element: <CharacterBreadcrumbContainer toTrail={toCharacterSheetTrail} />,
  },
  {
    path: ROUTES.campaignCharacterBuilder,
    element: <CharacterBreadcrumbContainer toTrail={toCharacterEditTrail} />,
  },
  { path: NO_TRAIL, element: null },
];

export function AppBreadcrumb() {
  return useRoutes(BREADCRUMB_ROUTES);
}

function CampaignBreadcrumbContainer({ toTrail }: { toTrail: CampaignTrail }) {
  const campaign = useCampaignRef();

  return <GuardedBreadcrumb trail={toTrail(campaign)} />;
}

function CharacterBreadcrumbContainer({ toTrail }: { toTrail: CharacterTrail }) {
  const campaign = useCampaignRef();
  const character = useCharacterRef(campaign.id);

  return <GuardedBreadcrumb trail={toTrail(campaign, character)} />;
}

function GuardedBreadcrumb({ trail }: { trail: Crumb[] }) {
  const onFollow = useGuardedFollow();

  return <BreadcrumbView trail={trail} onFollow={onFollow} />;
}
