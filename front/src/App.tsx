import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Home from "./pages/home/home.page";
import { CharactersPage } from "./pages/characters/characters.page";
import { CombatPage } from "./pages/combat/combat.page";
import { RegisterPage } from "./pages/register/register.page";
import { LoginPage } from "./pages/login/login.page";
import { VerifyEmailPage } from "./pages/verify-email/verify-email.page";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <h1 className="text-3xl font-bold underline text-center pb-8">
          Donjons & Dragons
        </h1>
        <nav className="flex justify-center gap-4 pb-6">
          <Link to="/">Accueil</Link>
          <Link to="/characters">Personnages</Link>
          <Link to="/combat">Combat</Link>
          <Link to="/register">S'inscrire</Link>
          <Link to="/login">Connexion</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/combat" element={<CombatPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
