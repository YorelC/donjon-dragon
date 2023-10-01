export type Race = "Humain" | "Elfe" | "Nain" | "Halfelin";
export type Classe = "Guerrier" | "Magicien" | "Rodeur" | "Prêtre";

export type Character = {
  race: Race;
  classe: Classe;
  force: number;
  dexterite: number;
  constitution: number;
  intelligence: number;
  sagesse: number;
  charisme: number;
};

export const racesList: Race[] = ["Humain", "Elfe", "Nain", "Halfelin"];
export const classesList: Classe[] = [
  "Guerrier",
  "Magicien",
  "Rodeur",
  "Prêtre",
];
