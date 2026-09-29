import {
  ROUTES,
  toCampaignDetailCharacters,
  toCampaignDetailUsers,
  toCharacterBuilder,
  toCharacterNew,
  toCharacterSheet,
} from "@/shared/constants/routes";

/** Une étape du fil : son nom, et l'écran où elle mène. */
export interface Crumb {
  label: string;
  to: string;
}

/** Ce qu'une étape retient d'une campagne ou d'un personnage : de quoi le nommer et y mener. */
export interface NamedRef {
  id: string;
  name: string;
}

export type CampaignTrail = (campaign: NamedRef) => Crumb[];
export type CharacterTrail = (campaign: NamedRef, character: NamedRef) => Crumb[];

/** Les étapes fixes du fil ; les autres portent le nom d'une campagne ou d'un personnage. */
const CRUMB_LABELS = {
  profile: "Profil",
  campaigns: "Campagnes",
  friends: "Amis",
  settings: "Compte",
  users: "Utilisateurs",
  characters: "Personnages",
  creation: "Nouveau personnage",
} as const;

/** « Profil » ramène aux campagnes : c'est l'écran d'arrivée de la barre du Profil. */
const PROFILE_CRUMB: Crumb = { label: CRUMB_LABELS.profile, to: ROUTES.campaigns };

export const CAMPAIGNS_TRAIL: Crumb[] = [
  PROFILE_CRUMB,
  { label: CRUMB_LABELS.campaigns, to: ROUTES.campaigns },
];

export const FRIENDS_TRAIL: Crumb[] = [
  PROFILE_CRUMB,
  { label: CRUMB_LABELS.friends, to: ROUTES.profileFriends },
];

export const SETTINGS_TRAIL: Crumb[] = [
  PROFILE_CRUMB,
  { label: CRUMB_LABELS.settings, to: ROUTES.profileSettings },
];

/** Une campagne s'ouvre sur ses personnages : son étape y mène. */
export function toCampaignTrail(campaign: NamedRef): Crumb[] {
  return [
    ...CAMPAIGNS_TRAIL,
    { label: campaign.name, to: toCampaignDetailCharacters(campaign.id) },
  ];
}

export function toCampaignUsersTrail(campaign: NamedRef): Crumb[] {
  return [
    ...toCampaignTrail(campaign),
    { label: CRUMB_LABELS.users, to: toCampaignDetailUsers(campaign.id) },
  ];
}

export function toCharacterCreationTrail(campaign: NamedRef): Crumb[] {
  return [
    ...toCharactersTrail(campaign),
    { label: CRUMB_LABELS.creation, to: toCharacterNew(campaign.id) },
  ];
}

export function toCharacterSheetTrail(campaign: NamedRef, character: NamedRef): Crumb[] {
  return [
    ...toCharactersTrail(campaign),
    { label: character.name, to: toCharacterSheet(campaign.id, character.id) },
  ];
}

export function toCharacterEditTrail(campaign: NamedRef, character: NamedRef): Crumb[] {
  return [
    ...toCharactersTrail(campaign),
    { label: character.name, to: toCharacterBuilder(campaign.id, character.id) },
  ];
}

function toCharactersTrail(campaign: NamedRef): Crumb[] {
  return [
    ...toCampaignTrail(campaign),
    { label: CRUMB_LABELS.characters, to: toCampaignDetailCharacters(campaign.id) },
  ];
}
