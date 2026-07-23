import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import Home from "./components/routes/Home";
import { CharactersPage } from "./pages/characters.page";
import { RegisterContainer } from "./features/auth/register.container";
import { LoginContainer } from "./features/auth/login.container";
import { VerifyEmailContainer } from "./features/auth/verify-email.container";

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
          <Link to="/register">S'inscrire</Link>
          <Link to="/login">Connexion</Link>
        </nav>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/characters" element={<CharactersPage />} />
          <Route path="/register" element={<RegisterContainer />} />
          <Route path="/login" element={<LoginContainer />} />
          <Route path="/verify-email" element={<VerifyEmailContainer />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
