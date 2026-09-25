import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/atoms/select";

export interface CatalogSelectOption {
  key: string;
  name: string;
}

interface CatalogSelectViewProps {
  label: string;
  options: readonly CatalogSelectOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

export function CatalogSelectView(props: CatalogSelectViewProps) {
  return (
    <div className="grid gap-2">
      <p className="field-label">{props.label}</p>
      <Select value={props.selectedKey ?? ""} onValueChange={props.onSelect}>
        <SelectTrigger className="w-full" aria-label={props.label}>
          <SelectValue placeholder="Choisir une option" />
        </SelectTrigger>
        <SelectContent>
          {props.options.map((option) => (
            <SelectItem key={option.key} value={option.key}>{option.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
