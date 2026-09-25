import { useState } from "react";
import type { CampaignCharacterListItem } from "@donjon-dragon/shared";
import { useUpdateCharacterPersonalDetails } from "../queries/use-character-personal-details";
import { CharacterPersonalDetailsView } from "../views/character-personal-details.view";

type ControlledCharacter = Exclude<CampaignCharacterListItem, { projection: "pool" }>;

interface CharacterPersonalDetailsContainerProps {
  campaignId: string;
  character: ControlledCharacter;
}

export function CharacterPersonalDetailsContainer(props: CharacterPersonalDetailsContainerProps) {
  const details = props.character.personalDetails;
  const update = useUpdateCharacterPersonalDetails(props.campaignId);
  const [age, setAge] = useState(String(details.age));
  const [weightKg, setWeightKg] = useState(String(details.weightKg));
  const [description, setDescription] = useState(details.description ?? "");
  const values = { age, weightKg, description };
  return <CharacterPersonalDetailsView
    values={values} isPending={update.isPending}
    onAgeChange={setAge} onWeightChange={setWeightKg} onDescriptionChange={setDescription}
    onSubmit={() => submit(props.character, values, update.mutate)}
  />;
}

interface EditableValues {
  age: string;
  weightKg: string;
  description: string;
}

function submit(
  character: ControlledCharacter,
  values: EditableValues,
  mutate: ReturnType<typeof useUpdateCharacterPersonalDetails>["mutate"],
): void {
  mutate({
    characterId: character.id, expectedRevision: character.revision,
    age: Number(values.age), weightKg: Number(values.weightKg),
    description: values.description.trim() || null,
  });
}
