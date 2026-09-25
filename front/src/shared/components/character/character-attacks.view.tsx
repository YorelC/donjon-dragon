import type { ComputedCharacter, ResolvedAttack } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/shared/components/atoms/table";

export function CharacterAttacksView({ sheet }: { sheet: ComputedCharacter }) {
  if (sheet.attacks.length === 0) return null;
  return <div className="grid gap-2">
    <h3 className="section-title text-sm">Attaques</h3>
    <Table>
      <TableHeader><TableRow>
        <TableHead>Arme</TableHead><TableHead>Attaque</TableHead><TableHead>Dégâts</TableHead>
      </TableRow></TableHeader>
      <TableBody>{sheet.attacks.map((attack) => <AttackRow key={attackKey(attack)} attack={attack} />)}</TableBody>
    </Table>
  </div>;
}

function AttackRow({ attack }: { attack: ResolvedAttack }) {
  return <TableRow>
    <TableCell><span className="font-medium">{attack.name}</span>
      {attack.source ? <Badge variant="secondary" className="ml-2">{sourceLabel(attack.source)}</Badge> : null}
    </TableCell>
    <TableCell>{signed(attack.attackBonus)}</TableCell>
    <TableCell>{attack.damage} {attack.damageType}</TableCell>
  </TableRow>;
}

function attackKey(attack: ResolvedAttack): string {
  return `${attack.weaponKey}:${attack.source ?? "equipment"}`;
}

function sourceLabel(source: NonNullable<ResolvedAttack["source"]>): string {
  return { "pact-of-the-blade": "Pacte de la Lame" }[source];
}

function signed(value: number): string {
  return value >= 0 ? `+${value}` : String(value);
}
