import type { CatalogInvocation, CatalogSpell } from "@donjon-dragon/shared";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/shared/components/atoms/select";
import { grantedSpellsOf, spellGrantsOf } from "../types/chosen-spells";
import type { StepBinding } from "../types/step-binding";
import { SpellGroup, previewing, selectionOf } from "./spell-group.view";

interface InvocationStepViewProps {
  binding: StepBinding;
  tomeSpells: { cantrips: CatalogSpell[]; rituals: CatalogSpell[] };
}

type InvocationProps = StepBinding & Pick<InvocationStepViewProps, "tomeSpells">;

/** Sa description se lit dans la fiche détaillée ; ici, ce qu'elle fait choisir. */
export function InvocationStepView({ binding, tomeSpells }: InvocationStepViewProps) {
  const props: InvocationProps = { ...binding, tomeSpells };
  const invocation = binding.catalog.invocations.find(
    (entry) => entry.key === binding.composition.invocation,
  );
  return <div className="flex flex-col gap-6">
    <InvocationSelect {...props} />
    {invocation ? <InvocationDetail {...props} invocation={invocation} /> : null}
  </div>;
}

function InvocationSelect({ catalog, composition, onChange }: InvocationProps) {
  return <Select value={composition.invocation ?? ""} onValueChange={(invocation) => onChange({
    invocation, invocationSpells: [], familiarForm: null, pactWeaponKey: null,
  })}>
    <SelectTrigger><SelectValue placeholder="Choisir une manifestation" /></SelectTrigger>
    <SelectContent>{catalog.invocations.map((entry) =>
      <SelectItem key={entry.key} value={entry.key}>{entry.name}</SelectItem>)}</SelectContent>
  </Select>;
}

function InvocationDetail(props: InvocationProps & { invocation: CatalogInvocation }) {
  const renderers = {
    none: () => null,
    familiar: () => <NamedSelect {...props} field="familiarForm" options={props.catalog.familiarForms} />,
    weapon: () => <NamedSelect {...props} field="pactWeaponKey" options={props.catalog.pactWeaponOptions} />,
    tome: () => <TomeChoice {...props} />,
  };
  return renderers[props.invocation.detail]();
}

interface NamedSelectProps extends InvocationProps {
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

function TomeChoice({ catalog, composition, tomeSpells, onChange, preview }: InvocationProps) {
  const context = { catalog, composition };
  const source = { composition, grantedSpells: grantedSpellsOf(context), grantedBy: spellGrantsOf(context) };
  const own = { group: "invocationSpells", keys: composition.invocationSpells };
  const cantrips = selectedFrom(composition.invocationSpells, tomeSpells.cantrips);
  const rituals = selectedFrom(composition.invocationSpells, tomeSpells.rituals);
  return <div className="grid gap-6">
    <SpellGroup title="Sorts mineurs du grimoire" spells={tomeSpells.cantrips} limit={3}
      selection={previewing(selectionOf(source, own,
        (next) => onChange({ invocationSpells: [...selectedFrom(next, tomeSpells.cantrips), ...rituals] })), preview)} />
    <SpellGroup title="Rituels de niveau 1" spells={tomeSpells.rituals} limit={2}
      selection={previewing(selectionOf(source, own,
        (next) => onChange({ invocationSpells: [...cantrips, ...selectedFrom(next, tomeSpells.rituals)] })), preview)} />
  </div>;
}

function selectedFrom(selected: readonly string[], spells: readonly CatalogSpell[]): string[] {
  return selected.filter((key) => spells.some((spell) => spell.key === key));
}
