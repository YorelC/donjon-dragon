interface CampaignsViewProps {
  displayName: string;
}

export function CampaignsView({ displayName }: CampaignsViewProps) {
  return (
    <section className="mx-auto max-w-2xl p-6 text-center">
      <h2 className="section-title">Bienvenue {displayName}</h2>
      <p className="muted-text">
        Aucune campagne pour le moment. Crée ou rejoins une campagne pour commencer.
      </p>
    </section>
  );
}
