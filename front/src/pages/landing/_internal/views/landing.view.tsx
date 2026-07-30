import { Link } from "react-router-dom";
import { Button } from "@/shared/components/atoms/button";
import { ROUTES } from "@/shared/constants/routes";

export function LandingView() {
  return (
    <section className="flex flex-col items-center gap-6 py-16 text-center">
      <h2 className="hero-title">
        Créez vos personnages, lancez-vous en combat.
      </h2>
      <p className="hero-subtitle">
        Gérez vos fiches de personnage Donjons & Dragons et affrontez vos
        ennemis en temps réel.
      </p>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link to={ROUTES.register}>S'inscrire</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to={ROUTES.login}>Se connecter</Link>
        </Button>
      </div>
    </section>
  );
}
