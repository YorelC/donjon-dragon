import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/home/home.page";
import { LandingPage } from "./pages/landing/landing.page";
import { CampaignsPage } from "./pages/campaigns/campaigns.page";
import { CampaignDetailPage } from "./pages/campaigns/detail/detail.page";
import { CampaignUsersPage } from "./pages/campaigns/detail/users/users.page";
import { CampaignCharactersPage } from "./pages/campaigns/detail/characters/characters.page";
import { CharacterBuilderPage } from "./pages/campaigns/detail/characters/builder/character-builder.page";
import { CharacterSheetPage } from "./pages/campaigns/detail/characters/sheet/sheet.page";
import { FriendsPage } from "./pages/profile/friends/friends.page";
import { VerifyEmailPage } from "./pages/verify-email/verify-email.page";
import { ProfilePage } from "./pages/profile/profile.page";
import { SettingsPage } from "./pages/profile/parametres/parametres.page";
import { ROUTES, toHomeTab } from "./shared/constants/routes";
import { AUTH_TAB } from "./shared/constants/auth-tab";
import { AppHeader } from "./shared/components/layout/app-header";
import { PrivateRoute } from "./shared/components/layout/private-route";
import { SESSION_STATUS, useAuthStore } from "./shared/stores/auth.store";
import { useSessionBootstrap } from "./shared/hooks/use-session-bootstrap";
import { Toaster } from "./shared/components/atoms/sonner";
import { TooltipProvider } from "./shared/components/atoms/tooltip";
import { useRealtimeInvalidation } from "./shared/realtime/use-realtime-invalidation";

const queryClient = new QueryClient();

function App() {
  // Une seule fois, à la racine : demander à /me si une session existe. Les cookies
  // étant httpOnly, c'est le seul moyen pour le front de le savoir.
  useSessionBootstrap();

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeBridge />
      <TooltipProvider>
        <BrowserRouter>
          <AppHeader />
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

function RealtimeBridge() {
  useRealtimeInvalidation();
  return null;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<HomeRoute />} />
      <Route element={<PrivateRoute />}>
        <Route path={ROUTES.campaigns} element={<CampaignsPage />} />
        {CampaignDetailRoutes()}
        {CharacterRoutes()}
        <Route path={ROUTES.profile} element={<ProfilePage />}>
          <Route index element={<Navigate to={ROUTES.profileFriends} />} />
          <Route path={ROUTES.profileFriends} element={<FriendsPage />} />
          <Route path={ROUTES.profileSettings} element={<SettingsPage />} />
        </Route>
      </Route>
      {AuthRedirectRoutes()}
      <Route path={ROUTES.verifyEmail} element={<VerifyEmailPage />} />
    </Routes>
  );
}

/**
 * L'inscription et la connexion vivent desormais sur l'accueil, dans un panneau
 * a deux onglets. Les deux anciennes routes restent des adresses valides : elles
 * ouvrent l'accueil sur le bon onglet.
 */
function AuthRedirectRoutes() {
  return (
    <>
      <Route
        path={ROUTES.register}
        element={<Navigate to={toHomeTab(AUTH_TAB.signup)} replace />}
      />
      <Route
        path={ROUTES.login}
        element={<Navigate to={toHomeTab(AUTH_TAB.login)} replace />}
      />
    </>
  );
}

/** Hors du layout de campagne : ces pages prennent toute la largeur. */
function CharacterRoutes() {
  return (
    <>
      <Route path={ROUTES.campaignCharacterNew} element={<CharacterBuilderPage />} />
      <Route path={ROUTES.campaignCharacterBuilder} element={<CharacterBuilderPage />} />
      <Route path={ROUTES.campaignCharacterSheet} element={<CharacterSheetPage />} />
    </>
  );
}

function CampaignDetailRoutes() {
  return (
    <Route path={ROUTES.campaignDetail} element={<CampaignDetailPage />}>
      <Route index element={<Navigate to="users" replace />} />
      <Route path={ROUTES.campaignDetailUsers} element={<CampaignUsersPage />} />
      <Route
        path={ROUTES.campaignDetailCharacters}
        element={<CampaignCharactersPage />}
      />
    </Route>
  );
}

function HomeRoute() {
  const status = useAuthStore((s) => s.status);

  // Tant que /me n'a pas répondu, ne rien trancher : afficher la landing page à un
  // utilisateur connecté qui recharge l'accueil serait un clignotement gratuit.
  if (status === SESSION_STATUS.unknown) return null;

  return status === SESSION_STATUS.authenticated ? <Home /> : <LandingPage />;
}

export default App;
