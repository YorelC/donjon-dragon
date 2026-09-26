import { backgroundOf, classOf } from "./builder-lookups";
import { STANDARD_LANGUAGE_QUOTA } from "./builder-validity";
import {
  selectionBlock,
  type DetailSource,
  type StepDetail,
} from "./step-detail-parts";

const RETAINED = "Retenu";
const AVAILABLE = "Disponible";

/** Une liste bornée : ce qu'elle nomme, ce qui est retenu, et combien il en faut. */
interface BoundedList {
  kicker: string;
  title: string;
  lede: string | null;
  labels: Partial<Record<string, string>>;
  selected: readonly string[];
  count: number;
}

/** L'option survolée, ou la liste entière et ce qu'on en a déjà retenu. */
function boundedDetail(source: DetailSource, list: BoundedList): StepDetail {
  const selection = selectionBlock(list.selected.map((key) => list.labels[key] ?? key), list.count);
  const focused = source.focusKey ? list.labels[source.focusKey] : undefined;
  if (focused && source.focusKey) {
    const state = list.selected.includes(source.focusKey) ? RETAINED : AVAILABLE;

    return { kicker: list.kicker, title: focused, lede: null, badges: [{ label: "État", value: state }], blocks: [selection] };
  }

  return {
    kicker: list.kicker,
    title: list.title,
    lede: list.lede,
    badges: [{ label: "À choisir", value: `${list.selected.length} / ${list.count}` }],
    blocks: [selection],
  };
}

export function languagesDetail(source: DetailSource): StepDetail {
  const { catalog, composition } = source.context;

  return boundedDetail(source, {
    kicker: "Langues", title: "Langues standards", count: STANDARD_LANGUAGE_QUOTA,
    lede: "Le Commun vous est acquis d'office ; les langues rares relèvent d'autres sources.",
    labels: Object.fromEntries(catalog.languages.standard.map((entry) => [entry.key, entry.name])),
    selected: composition.standardLanguages,
  });
}

export function classLanguageDetail(source: DetailSource): StepDetail {
  const { catalog, composition } = source.context;
  const languages = [...catalog.languages.standard, ...catalog.languages.rare];

  return boundedDetail(source, {
    kicker: "Langue de classe", title: "Une langue de plus", count: 1,
    lede: "Standard ou rare, pourvu que vous ne la parliez pas déjà.",
    labels: Object.fromEntries(languages.map((entry) => [entry.key, entry.name])),
    selected: composition.classLanguage ? [composition.classLanguage] : [],
  });
}

export function backgroundToolDetail(source: DetailSource): StepDetail {
  const { context } = source;
  const tool = context.composition.backgroundTool;

  return boundedDetail(source, {
    kicker: backgroundOf(context)?.name ?? "Historique", title: "Outil d'historique", count: 1,
    lede: null, labels: context.catalog.toolLabels, selected: tool ? [tool] : [],
  });
}

export function classToolsDetail(source: DetailSource): StepDetail {
  const { context } = source;

  return boundedDetail(source, {
    kicker: classOf(context)?.name ?? "Classe", title: "Outils de classe",
    count: classOf(context)?.toolChoice?.count ?? 0, lede: null,
    labels: context.catalog.toolLabels, selected: context.composition.classTools,
  });
}

export function weaponMasteriesDetail(source: DetailSource): StepDetail {
  const { context } = source;

  return boundedDetail(source, {
    kicker: classOf(context)?.name ?? "Classe", title: "Maîtrises d'armes",
    count: classOf(context)?.weaponMastery?.count ?? 0,
    lede: "Vous exploitez la botte des armes choisies. Vous pourrez en changer après un Repos long.",
    labels: context.catalog.weaponLabels, selected: context.composition.weaponMasteries,
  });
}
