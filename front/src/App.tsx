import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Home from "./pages/home/home.page";
import { CharactersPage } from "./pages/characters/characters.page";
import { CombatPage } from "./pages/combat/combat.page";
import { RegisterPage } from "./pages/register/register.page";
import { LoginPage } from "./pages/login/login.page";
import { VerifyEmailPage } from "./pages/verify-email/verify-email.page";
import { ROUTES } from "./shared/constants/routes";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <h1 className="text-3xl font-bold underline text-center pb-8">
          Donjons & Dragons
        </h1>
        <nav className="flex justify-center gap-4 pb-6">
          <Link to={ROUTES.home}>Accueil</Link>
          <Link to={ROUTES.characters}>Personnages</Link>
          <Link to={ROUTES.combat}>Combat</Link>
          <Link to={ROUTES.register}>S'inscrire</Link>
          <Link to={ROUTES.login}>Connexion</Link>
        </nav>
        <Routes>
          <Route path={ROUTES.home} element={<Home />} />
          <Route path={ROUTES.characters} element={<CharactersPage />} />
          <Route path={ROUTES.combat} element={<CombatPage />} />
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.verifyEmail} element={<VerifyEmailPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
