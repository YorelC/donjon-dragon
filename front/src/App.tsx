import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/home/home.page";
import { LandingPage } from "./pages/landing/landing.page";
import { CampaignsPage } from "./pages/campaigns/campaigns.page";
import { FriendsPage } from "./pages/profile/friends/friends.page";
import { RegisterPage } from "./pages/register/register.page";
import { LoginPage } from "./pages/login/login.page";
import { VerifyEmailPage } from "./pages/verify-email/verify-email.page";
import { ProfilePage } from "./pages/profile/profile.page";
import { SettingsPage } from "./pages/profile/parametres/parametres.page";
import { ROUTES } from "./shared/constants/routes";
import { Nav } from "./shared/components/layout/nav";
import { PrivateRoute } from "./shared/components/layout/private-route";
import { SESSION_STATUS, useAuthStore } from "./shared/stores/auth.store";
import { useSessionBootstrap } from "./shared/hooks/use-session-bootstrap";
import { Toaster } from "./shared/components/atoms/sonner";

const queryClient = new QueryClient();

function App() {
  // Une seule fois, à la racine : demander à /me si une session existe. Les cookies
  // étant httpOnly, c'est le seul moyen pour le front de le savoir.
  useSessionBootstrap();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <h1 className="page-title">Donjons & Dragons</h1>
        <Nav />
        <AppRoutes />
      </BrowserRouter>
      <Toaster />
    </QueryClientProvider>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<HomeRoute />} />
      <Route element={<PrivateRoute />}>
        <Route path={ROUTES.campaigns} element={<CampaignsPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />}>
          <Route index element={<Navigate to={ROUTES.profileFriends} />} />
          <Route path={ROUTES.profileFriends} element={<FriendsPage />} />
          <Route path={ROUTES.profileSettings} element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path={ROUTES.register} element={<RegisterPage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.verifyEmail} element={<VerifyEmailPage />} />
    </Routes>
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
