export const ROUTES = {
  home: "/",
  campaigns: "/campaigns",
  campaignDetail: "/campaigns/:campaignId",
  campaignDetailUsers: "/campaigns/:campaignId/users",
  campaignDetailCharacters: "/campaigns/:campaignId/characters",
  campaignCharacterNew: "/campaigns/:campaignId/characters/new",
  campaignCharacterBuilder: "/campaigns/:campaignId/characters/:characterId/builder",
  campaignCharacterSheet: "/campaigns/:campaignId/characters/:characterId/sheet",
  profile: "/profile",
  profileFriends: "/profile/friends",
  profileSettings: "/profile/parametres",
  register: "/register",
  login: "/login",
  verifyEmail: "/verify-email",
} as const;

/**
 * `ROUTES.campaignDetail` porte le motif que react-router doit matcher ; cette
 * fabrique porte l'URL qu'on met dans un lien. Les deux ne peuvent pas être la
 * même chaîne, et les séparer évite d'écrire `/campaigns/` à la main ailleurs.
 */
export const toCampaignDetail = (campaignId: string): string =>
  `/campaigns/${encodeURIComponent(campaignId)}`;

export const toCampaignDetailUsers = (campaignId: string): string =>
  `${toCampaignDetail(campaignId)}/users`;

export const toCampaignDetailCharacters = (campaignId: string): string =>
  `${toCampaignDetail(campaignId)}/characters`;

export const toCharacterNew = (campaignId: string): string =>
  `${toCampaignDetailCharacters(campaignId)}/new`;

/** Le builder d'un personnage déjà créé : montée de niveau, correction. */
export const toCharacterBuilder = (campaignId: string, characterId: string): string =>
  `${toCampaignDetailCharacters(campaignId)}/${encodeURIComponent(characterId)}/builder`;

export const toCharacterSheet = (campaignId: string, characterId: string): string =>
  `${toCampaignDetailCharacters(campaignId)}/${encodeURIComponent(characterId)}/sheet`;
