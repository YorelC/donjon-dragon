import type { Control, FieldErrors } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Button } from "@/components/atoms/button";
import { FormNumberInput } from "@/components/molecules/form-number-input";
import { FormSelectInput } from "@/components/molecules/form-select-input";
import { FormTextInput } from "@/components/molecules/form-text-input";
import { ClassEnum, RaceEnum, type CharacterFormValues } from "./character-schema";

const STAT_FIELDS = [
  ["strength", "Force", "stats.strength"],
  ["dexterity", "Dextérité", "stats.dexterity"],
  ["constitution", "Constitution", "stats.constitution"],
  ["intelligence", "Intelligence", "stats.intelligence"],
  ["wisdom", "Sagesse", "stats.wisdom"],
  ["charisma", "Charisme", "stats.charisma"],
] as const;

interface CharacterFormViewProps {
  control: Control<CharacterFormValues>;
  errors: FieldErrors<CharacterFormValues>;
  onFormSubmit: (event: React.FormEvent) => void;
  isSubmitting: boolean;
}

export function CharacterFormView({
  control,
  errors,
  onFormSubmit,
  isSubmitting,
}: CharacterFormViewProps) {
  return (
    <form onSubmit={onFormSubmit} className="flex flex-col gap-4">
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <FormTextInput label="Nom" field={field} error={errors.name?.message} />
        )}
      />

      <Controller
        name="level"
        control={control}
        render={({ field }) => (
          <FormNumberInput label="Niveau" field={field} error={errors.level?.message} />
        )}
      />

      <Controller
        name="race"
        control={control}
        render={({ field }) => (
          <FormSelectInput
            label="Race"
            field={field}
            error={errors.race?.message}
            options={RaceEnum.options}
            placeholder="Choisir une race"
          />
        )}
      />

      <Controller
        name="class"
        control={control}
        render={({ field }) => (
          <FormSelectInput
            label="Classe"
            field={field}
            error={errors.class?.message}
            options={ClassEnum.options}
            placeholder="Choisir une classe"
          />
        )}
      />

      <fieldset className="grid grid-cols-2 gap-3">
        <legend className="mb-1 text-sm font-medium">Caractéristiques</legend>
        {STAT_FIELDS.map(([key, label, path]) => (
          <Controller
            key={key}
            name={path}
            control={control}
            render={({ field }) => (
              <FormNumberInput label={label} field={field} error={errors.stats?.[key]?.message} />
            )}
          />
        ))}
      </fieldset>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Création..." : "Créer le personnage"}
      </Button>
    </form>
  );
}
