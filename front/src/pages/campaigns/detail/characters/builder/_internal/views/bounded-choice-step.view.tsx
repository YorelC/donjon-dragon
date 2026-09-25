import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";

export interface BoundedChoice {
  count: number;
  options: readonly string[];
  labels: Record<string, string>;
  selected: readonly string[];
  blocked: readonly string[];
  onChange: (selected: string[]) => void;
}

export function BoundedChoiceStepView({ choice }: { choice: BoundedChoice }) {
  return (
    <div className="grid gap-2">
      <p className="muted-text">
        Choisissez {choice.count} option{choice.count > 1 ? "s" : ""}.{" "}
        <Badge variant="outline">{choice.selected.length} / {choice.count}</Badge>
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {choice.options.map((option) => (
          <BoundedChoiceButton key={option} option={option} choice={choice} />
        ))}
      </div>
    </div>
  );
}

function BoundedChoiceButton({ option, choice }: { option: string; choice: BoundedChoice }) {
  const selected = choice.selected.includes(option);
  const full = choice.selected.length >= choice.count;
  const disabled = choice.blocked.includes(option) || (full && !selected);

  return (
    <Button
      type="button"
      size="sm"
      variant={selected ? "default" : "outline"}
      disabled={disabled}
      onClick={() => choice.onChange(toggle(choice.selected, option))}
    >
      {choice.labels[option] ?? option}
    </Button>
  );
}

function toggle(selected: readonly string[], option: string): string[] {
  return selected.includes(option)
    ? selected.filter((entry) => entry !== option)
    : [...selected, option];
}
