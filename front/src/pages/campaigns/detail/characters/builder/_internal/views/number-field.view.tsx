import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";

interface NumberFieldViewProps {
  id: string;
  label: string;
  value: number | null;
  disabled: boolean;
  onValue: (value: number | null) => void;
  parse: (raw: string) => number | null;
}

export function NumberFieldView(props: NumberFieldViewProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type="number"
        inputMode="numeric"
        value={props.value ?? ""}
        disabled={props.disabled}
        onChange={(event) => props.onValue(props.parse(event.target.value))}
      />
    </div>
  );
}
