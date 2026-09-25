import type { CatalogMeasurementRange } from "@donjon-dragon/shared";
import { Input } from "@/shared/components/atoms/input";
import { Label } from "@/shared/components/atoms/label";
import { defaultMeasurementOf, positiveNumberFieldValue } from "../types/identity-fields";

interface Measurement {
  id: string;
  label: string;
  unit: string;
  range: CatalogMeasurementRange;
  value: number | null;
  onValue: (value: number | null) => void;
}

interface MeasurementScaleViewProps {
  measurement: Measurement;
  disabled: boolean;
}

export function MeasurementScaleView(props: MeasurementScaleViewProps) {
  const { measurement, disabled } = props;
  const { id, range, value, onValue } = measurement;

  return (
    <div className="grid gap-2">
      <MeasurementHeading measurement={measurement} />
      <Input
        id={`${id}-scale`}
        className="measurement-slider"
        type="range"
        min={range.min}
        max={range.max}
        step={1}
        value={value ?? defaultMeasurementOf(range)}
        disabled={disabled}
        onChange={(event) => onValue(Number(event.target.value))}
      />
      <MeasurementNumberInput measurement={measurement} disabled={disabled} />
    </div>
  );
}

function MeasurementHeading({ measurement }: { measurement: Measurement }) {
  const { id, label, unit, range, value } = measurement;

  return (
    <div className="flex items-baseline justify-between gap-3">
      <Label htmlFor={`${id}-scale`}>{label}</Label>
      <output className="text-sm text-gold-value" htmlFor={`${id}-scale`}>
        {value === null ? "À définir" : `${value} ${unit}`}
      </output>
      <span className="muted-text-xs">{range.min}–{range.max} {unit}</span>
    </div>
  );
}

function MeasurementNumberInput(props: MeasurementScaleViewProps) {
  const { id, unit, range, value, onValue } = props.measurement;

  return (
    <Input
      id={id}
      aria-label={`${props.measurement.label} en ${unit}`}
      type="number"
      inputMode="numeric"
      min={range.min}
      max={range.max}
      step={1}
      value={value ?? ""}
      disabled={props.disabled}
      onChange={(event) => onValue(positiveNumberFieldValue(event.target.value))}
    />
  );
}
