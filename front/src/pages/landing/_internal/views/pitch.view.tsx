import { DiamondRule } from "@/shared/components/molecules/gold-rule";
import { NameValueRow } from "@/shared/components/molecules/name-value-row";

/** La colonne de présentation : ce que la table promet, avant de s'y asseoir. */
export function PitchView() {
  return (
    <section className="flex min-w-0 flex-col">
      <PitchHeading />
      <p className="mt-[22px] max-w-[500px] intro-text">
        Gérez vos fiches de personnage Donjons &amp; Dragons et affrontez vos
        ennemis en temps réel.
      </p>
      <PitchFeatures />
    </section>
  );
}

function PitchHeading() {
  return (
    <>
      <span className="eyebrow">
        Table de jeu · 5<sup className="text-[8px]">e</sup> édition 2024
      </span>
      <h1 className="mt-[18px] display-title">
        Menez vos campagnes, créez vos personnages, lancez vos combats.
      </h1>
      <div className="mt-6 w-full max-w-[460px]">
        <DiamondRule />
      </div>
    </>
  );
}

interface PitchFeature {
  name: string;
  value: string;
}

const PITCH_FEATURES: PitchFeature[] = [
  {
    name: "Fiches",
    value:
      "Caractéristiques, jets de sauvegarde et sorts calculés automatiquement.",
  },
  {
    name: "Combat",
    value:
      "Le combat se joue à l'écran, au tour par tour : chaque action, chaque portée, chaque adversaire sous les yeux du groupe.",
  },
  {
    name: "Dés",
    value:
      "Vous lancez les dés comme à la vraie table : chaque jet est visible par tout le monde, rien n'est truqué.",
  },
];

function PitchFeatures() {
  return (
    <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-x-[26px] gap-y-[18px]">
      {PITCH_FEATURES.map((feature) => (
        <NameValueRow
          key={feature.name}
          name={feature.name}
          value={feature.value}
        />
      ))}
    </div>
  );
}
