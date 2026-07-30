import { Link } from "react-router-dom";
import { Button } from "@/shared/components/atoms/button";
import { ROUTES } from "@/shared/constants/routes";

export function HomeView() {
  return (
    <section className="flex flex-col items-center gap-6 py-16 text-center">
      <h2 className="hero-title">Bon retour, aventurier.</h2>
      <div className="flex gap-4">
        <Button asChild size="lg">
          <Link to={ROUTES.characters}>Mes personnages</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link to={ROUTES.combat}>Combat</Link>
        </Button>
      </div>
    </section>
  );
}
