import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/atoms/card";
import { cn } from "@/shared/utils/utils";

export interface SelectableOption {
  key: string;
  name: string;
  description?: string;
}

interface OptionListProps {
  options: readonly SelectableOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}

/** La liste de choix du builder : espèce, classe, historique, lignage. */
export function OptionListView({ options, selectedKey, onSelect }: OptionListProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {options.map((option) => (
        <OptionCard
          key={option.key}
          option={option}
          selected={option.key === selectedKey}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

interface OptionCardProps {
  option: SelectableOption;
  selected: boolean;
  onSelect: (key: string) => void;
}

function OptionCard({ option, selected, onSelect }: OptionCardProps) {
  return (
    <Card
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      onClick={() => onSelect(option.key)}
      onKeyDown={(event) => event.key === "Enter" && onSelect(option.key)}
      className={cn(
        "cursor-pointer transition-colors hover:border-primary",
        selected && "border-primary ring-1 ring-primary",
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{option.name}</CardTitle>
      </CardHeader>
      {option.description ? (
        <CardContent className="pt-0 text-sm text-muted-foreground line-clamp-3">
          {option.description}
        </CardContent>
      ) : null}
    </Card>
  );
}
