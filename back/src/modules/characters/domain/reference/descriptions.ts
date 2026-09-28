// Les textes de présentation que le créateur affiche en tête de ses fiches.
// Données de référence : pures, immuables, sans I/O.
//
// Sources : la maquette du créateur (docs/ui-design/Page_menu_utilisateur_avec_profil/
// Createur de personnage.dc.html) pour les espèces, classes, compétences et
// alignements ; le SRD 2024 (docs/characteres/srd-2024/5e-SRD-Ability-Scores.json,
// CC-BY-4.0), traduit, pour les caractéristiques. L'Aasimar, absent de la
// maquette, a été rédigé dans le même ton et reste à relire par Charly.

import type { Alignment } from '../character-identity';
import type { Ability } from './abilities';
import type { ClassKey, LineageKey, SpeciesKey } from './keys';
import type { SkillName } from './skills';

export const SPECIES_DESCRIPTIONS: Readonly<Record<SpeciesKey, string>> = {
  aasimar:
    "Une étincelle céleste brûle en vous. Les aasimars portent la lumière d'un plan supérieur : leurs mains soignent, leur regard s'embrase, et leur ascendance les appelle à protéger ce qui mérite de l'être.",
  dragonborn:
    'Le sang des dragons du temps jadis coule dans vos veines. Écailles, souffle et présence : les drakéides portent leur ascendance comme un titre.',
  dwarf:
    'Façonnés dans la pierre et le fer, les nains vivent longtemps et se souviennent plus longtemps encore. Leur peuple compte des artisans, des guerriers et des gardiens de forteresses souterraines.',
  elf: "Les elfes sont un peuple magique d'une grâce surnaturelle, vivant dans le monde sans tout à fait en faire partie. Ils ont été imprégnés de la magie issue des croisements entre la Féerie et le plan Matériel.",
  gnome:
    "Inventifs jusqu'à l'obsession, les gnomes trouvent dans chaque mécanisme et chaque sort une énigme à démonter.",
  goliath:
    'Le sang des géants leur donne la stature et la fierté. Les goliaths mesurent leur valeur à ce qu’ils portent, gravissent et endurent.',
  halfling:
    "Petits, discrets et d'un optimisme obstiné, les halfelins traversent les périls du monde avec une chance qui confine au surnaturel.",
  human:
    "Ambitieux, adaptables, présents partout : les humains bâtissent, commercent et conquièrent en une poignée de décennies ce que d'autres peuples mettent des siècles à mûrir.",
  orc: "Endurance, élan, refus de tomber. Les orcs portent en eux le don de Gruumsh : celui d'aller plus loin que le corps ne le permet.",
  tiefling:
    "Une ascendance planaire marque votre lignée : cornes, regard, et une magie qui affleure. Les tieffelins vivent avec la réputation qu'on leur prête avant de les connaître.",
};

/**
 * Les lignages : la présentation qui ouvre leur fiche. La clé d'un lignage
 * n'est pas une énumération fermée (`LineageKey` vaut `string`) : le test du
 * catalogue vérifie que chacun a la sienne.
 */
export const LINEAGE_DESCRIPTIONS: Readonly<Record<LineageKey, string>> = {
  drow: "Les drows vivent généralement dans l'Outreterre, où ils ont été façonnés. Certaines sociétés drows évitent l'Outreterre tout en conservant sa magie.",
  'high-elf':
    'Les hauts-elfes ont été imprégnés de la magie issue des croisements entre la Féerie et le plan Matériel. Ils se nomment ailleurs elfes du soleil ou de la lune.',
  'wood-elf':
    "Les elfes des bois portent en eux la magie des forêts primitives. On les connaît aussi sous les noms d'elfes sauvages, elfes verts ou elfes sylvestres.",
  black:
    "Bien que ces drakéides n'aient aucun lien avec les dragons noirs, ils ont la même couleur d'écailles et possèdent eux aussi un souffle d'acide.",
  blue: "Écailles d'orage et regard électrique : ces drakéides portent la foudre dans le souffle.",
  red: "L'ascendance la plus redoutée : le feu couve dans leur gorge comme dans une forge.",
  green: 'Un souffle acide et corrosif, hérité des dragons des forêts profondes.',
  white: 'Écailles de givre, souffle de gel : ces drakéides viennent des hautes terres glacées.',
  brass: "Bavards et curieux, les drakéides d'airain manient un souffle de feu en ligne.",
  bronze: "Gardiens des côtes, ils exhalent l'éclair de la tempête marine.",
  copper: 'Farceurs et vifs, leur souffle ronge la pierre comme le métal.',
  gold: "Une ascendance royale, dont le souffle brûle d'une flamme claire.",
  silver: 'Descendants des dragons des cimes enneigées, au souffle de gel.',
  'forest-gnome':
    'Discrets et proches des bêtes, les gnomes des forêts vivent au creux des bois anciens.',
  'rock-gnome':
    'Bricoleurs infatigables, ils creusent, assemblent et rafistolent tout ce qui leur passe entre les mains.',
  'fire-giant': "L'ardeur des forges volcaniques.",
  'frost-giant': 'La morsure du nord.',
  'hill-giant': "La masse tranquille et l'appétit qui va avec.",
  'stone-giant': 'La patience des montagnes.',
  'cloud-giant': 'Le caprice des hauteurs.',
  'storm-giant': "L'orage sous la peau.",
  abyssal: 'Le chaos des Abysses coule dans vos veines.',
  chthonian: "Les plans de la mort et de l'ombre ont touché votre sang.",
  infernal: 'Les Neuf Enfers ont scellé un pacte avec vos ancêtres.',
};

export const CLASS_DESCRIPTIONS: Readonly<Record<ClassKey, string>> = {
  barbarian:
    'Rage brute et instinct de survie : le barbare encaisse ce qui devrait le briser et frappe avant que le calcul ne commence.',
  bard: 'Le barde tisse la magie dans le mot, la note et le geste. Il inspire, détourne, négocie, et sait généralement une chose de trop sur chacun.',
  cleric:
    'Un canal vivant entre le divin et le champ de bataille. Le clerc soigne, bénit, et frappe au nom de ce qu’il sert.',
  druid:
    'Gardien des cycles naturels. Le druide emprunte la forme des bêtes, appelle l’orage et connaît le prix de chaque saison.',
  fighter:
    'Le métier des armes poussé à son terme. Le guerrier lit un champ de bataille comme d’autres lisent une carte, et frappe plus souvent que quiconque.',
  monk: 'Le corps discipliné devient l’arme. Le moine canalise le Ki en frappes rapides, en déplacements impossibles et en une concentration qui ne cède pas.',
  paladin:
    'Un serment tenu, quoi qu’il en coûte. Le paladin soigne par imposition des mains et fait payer ses ennemis à chaque coup porté.',
  ranger:
    'Traqueur des marges du monde. Le rôdeur lit une piste, marque sa proie et emprunte à la nature une magie sobre et efficace.',
  rogue:
    'Le bon geste au bon moment. Le roublard trouve l’angle mort, l’ouverture, le mot juste, et facture le reste au hasard.',
  sorcerer:
    'La magie ne s’apprend pas, elle se subit. L’ensorceleur plie une puissance innée à sa volonté, et improvise là où d’autres récitent.',
  warlock:
    'Un pacte, une entité, et une magie prêtée. L’occultiste paie ses pouvoirs en obligations, et sait exactement ce qu’il a signé.',
  wizard:
    'Maîtres des arcanes férus de recherche et d’expérimentation, les magiciens se spécialisent dans diverses écoles pour tirer la quintessence de la magie ancestrale.',
};

export const SKILL_DESCRIPTIONS: Readonly<Record<SkillName, string>> = {
  acrobatics: 'Garder l’équilibre sur un terrain instable, se rétablir, échapper à une entrave.',
  animalHandling: 'Calmer une bête, la dresser, la monter en situation difficile, lire son comportement.',
  arcana: 'Reconnaître un sort en cours, identifier un objet magique, connaître les plans d’existence.',
  athletics: 'Grimper, nager, sauter, forcer une porte ou se dégager d’une empoignade.',
  deception: 'Mentir avec aplomb, déguiser la vérité, se faire passer pour un autre.',
  history: 'Se souvenir des royaumes, des guerres, des dynasties et des civilisations disparues.',
  insight: 'Lire les intentions d’autrui : détecter un mensonge, sentir un piège social.',
  intimidation: 'Obtenir par la menace, la démonstration de force ou la seule présence.',
  investigation: 'Déduire d’un indice : chercher un mécanisme, un passage secret, repérer un faux.',
  medicine: 'Stabiliser un mourant, diagnostiquer une maladie, déterminer la cause d’une mort.',
  nature: 'Connaître le terrain, les plantes, les bêtes, la météo et les cycles naturels.',
  perception: 'Repérer, écouter, remarquer ce qui cloche : embuscade, guetteur, détail hors de place.',
  performance: 'Captiver un public : chant, musique, danse, joute oratoire, numéro de scène.',
  persuasion: 'Convaincre de bonne foi : négocier, obtenir une faveur, apaiser un conflit.',
  religion: 'Connaître les divinités, les rites, les ordres et les symboles sacrés ou blasphématoires.',
  sleightOfHand: 'Tours de main : faire les poches, dissimuler un objet, détourner l’attention par le geste.',
  stealth: 'Se déplacer sans être vu ni entendu, se cacher, filer quelqu’un dans la foule.',
  survival: 'Pister, chasser, s’orienter en pleine nature, prévoir la météo et les dangers du terrain.',
};

export const ABILITY_DESCRIPTIONS: Readonly<Record<Ability, string>> = {
  strength: 'Puissance physique.',
  dexterity: 'Agilité, réflexes et équilibre.',
  constitution: 'Santé et endurance.',
  intelligence: 'Raisonnement et mémoire.',
  wisdom: 'Perception et discernement.',
  charisma: 'Assurance, aplomb et charme.',
};

export const ALIGNMENT_DESCRIPTIONS: Readonly<Record<Alignment, string>> = {
  lawfulGood:
    'Vous agissez comme un être bon doit agir, selon des règles que vous respectez. Serment tenu, dette honorée, faible défendu : l’ordre est pour vous le meilleur outil du bien.',
  neutralGood:
    'Vous faites le bien sans vous encombrer d’un code. La loi vous aide quand elle protège, vous la contournez quand elle nuit.',
  chaoticGood:
    'Votre conscience passe avant toute autorité. Vous aidez selon votre jugement, quitte à briser la règle et à en assumer le prix.',
  lawfulNeutral:
    'L’ordre pour lui-même. Vous suivez la loi, la tradition ou votre propre code sans vous demander à qui il profite.',
  trueNeutral:
    'Vous évitez les extrêmes et gardez l’équilibre. Vous jugez au cas par cas, sans camp et sans croisade.',
  chaoticNeutral:
    'La liberté avant tout, la vôtre en premier. Vous suivez vos envies sans intention de nuire ni volonté de servir.',
  lawfulEvil:
    'Vous prenez ce que vous voulez, dans les limites d’un code ou d’une hiérarchie. Le contrat, la tradition ou l’ordre justifient la cruauté.',
  neutralEvil:
    'Vous faites ce qui vous sert, sans scrupule ni goût particulier pour la destruction. La loyauté est une dépense que vous évitez.',
  chaoticEvil:
    'Violence et caprice, sans frein ni plan. Vous ne devez rien à personne et le faites savoir.',
};
