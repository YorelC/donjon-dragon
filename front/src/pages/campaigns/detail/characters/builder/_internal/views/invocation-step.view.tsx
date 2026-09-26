import type { CatalogInvocation, CatalogSpell, DndCatalog } from "@donjon-dragon/shared";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/atoms/select";
import type { CharacterComposition } from "../types/character-composition";
import { grantedSpellsOf } from "../types/chosen-spells";
import { SpellGroup, selectionOf } from "./spell-group.view";

interface InvocationStepViewProps {
  catalog: DndCatalog;
  composition: CharacterComposition;
  tomeSpells: { cantrips: CatalogSpell[]; rituals: CatalogSpell[] };
  onChange: (patch: Partial<CharacterComposition>) => void;
}

export function InvocationStepView(props: InvocationStepViewProps) {
  const invocation = props.catalog.invocations.find(
    (entry) => entry.key === props.composition.invocation,
  );
  return <div className="grid gap-6">
    <InvocationSelect {...props} />
    {invocation ? <InvocationDetail {...props} invocation={invocation} /> : null}
  </div>;
}

function InvocationSelect({ catalog, composition, onChange }: InvocationStepViewProps) {
  return <Select value={composition.invocation ?? ""} onValueChange={(invocation) => onChange({
    invocation, invocationSpells: [], familiarForm: null, pactWeaponKey: null,
  })}>
    <SelectTrigger><SelectValue placeholder="Choisir une manifestation" /></SelectTrigger>
    <SelectContent>{catalog.invocations.map((entry) =>
      <SelectItem key={entry.key} value={entry.key}>{entry.name}</SelectItem>)}</SelectContent>
  </Select>;
}

function InvocationDetail(props: InvocationStepViewProps & { invocation: CatalogInvocation }) {
  const renderers = {
    none: () => <p className="text-sm text-muted-foreground">{props.invocation.description}</p>,
    familiar: () => <NamedSelect {...props} field="familiarForm" options={props.catalog.familiarForms} />,
    weapon: () => <NamedSelect {...props} field="pactWeaponKey" options={props.catalog.pactWeaponOptions} />,
    tome: () => <TomeChoice {...props} />,
  };
  return renderers[props.invocation.detail]();
}

interface NamedSelectProps extends InvocationStepViewProps {
  field: "familiarForm" | "pactWeaponKey";
  options: { key: string; name: string }[];
}

function NamedSelect({ composition, field, options, onChange }: NamedSelectProps) {
  return <Select value={composition[field] ?? ""} onValueChange={(value) => onChange({ [field]: value })}>
    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
    <SelectContent>{options.map((entry) =>
      <SelectItem key={entry.key} value={entry.key}>{entry.name}</SelectItem>)}</SelectContent>
  </Select>;
}

function TomeChoice({ catalog, composition, tomeSpells, onChange }: InvocationStepViewProps) {
  const source = { composition, grantedSpells: grantedSpellsOf({ catalog, composition }) };
  const cantrips = selectedFrom(composition.invocationSpells, tomeSpells.cantrips);
  const rituals = selectedFrom(composition.invocationSpells, tomeSpells.rituals);
  return <div className="grid gap-6">
    <SpellGroup title="Sorts mineurs du grimoire" spells={tomeSpells.cantrips} limit={3}
      selection={selectionOf(source, composition.invocationSpells,
        (next) => onChange({ invocationSpells: [...selectedFrom(next, tomeSpells.cantrips), ...rituals] }))} />
    <SpellGroup title="Rituels de niveau 1" spells={tomeSpells.rituals} limit={2}
      selection={selectionOf(source, composition.invocationSpells,
        (next) => onChange({ invocationSpells: [...cantrips, ...selectedFrom(next, tomeSpells.rituals)] }))} />
  </div>;
}

function selectedFrom(selected: readonly string[], spells: readonly CatalogSpell[]): string[] {
  return selected.filter((key) => spells.some((spell) => spell.key === key));
}
