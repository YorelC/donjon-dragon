import { useState } from "react";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { useUpdateCharacterPersonalDetails } from "../queries/use-character-personal-details";
import { CharacterPersonalDetailsView } from "../views/character-personal-details.view";
import type { EditablePersonalDetailsValues } from "../views/character-personal-details.view";

type ControlledCharacter = CampaignCharacterListItem;

interface CharacterPersonalDetailsContainerProps {
  campaignId: string;
  character: ControlledCharacter;
}

export function CharacterPersonalDetailsContainer(props: CharacterPersonalDetailsContainerProps) {
  const details = props.character.personalDetails;
  const update = useUpdateCharacterPersonalDetails(props.campaignId);
  const [values, setValues] = useState(() => editableValuesOf(details));
  return <CharacterPersonalDetailsView
    values={values} isPending={update.isPending}
    onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
    onSubmit={() => submit(props.character, values, update.mutate)}
  />;
}

function editableValuesOf(details: ControlledCharacter["personalDetails"]): EditablePersonalDetailsValues {
  return {
    age: String(details.age),
    weightKg: String(details.weightKg),
    personalityTraits: details.personalityTraits ?? "",
    ideals: details.ideals ?? "",
    bonds: details.bonds ?? "",
    flaws: details.flaws ?? "",
    description: details.description ?? "",
  };
}

function submit(
  character: ControlledCharacter,
  values: EditablePersonalDetailsValues,
  mutate: ReturnType<typeof useUpdateCharacterPersonalDetails>["mutate"],
): void {
  mutate({
    characterId: character.id, expectedRevision: character.revision,
    age: Number(values.age), weightKg: Number(values.weightKg),
    personalityTraits: optionalText(values.personalityTraits),
    ideals: optionalText(values.ideals), bonds: optionalText(values.bonds),
    flaws: optionalText(values.flaws), description: optionalText(values.description),
  });
}

function optionalText(value: string): string | null {
  return value.trim() || null;
}
