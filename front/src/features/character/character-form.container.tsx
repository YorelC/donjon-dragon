import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CharacterFormView } from "./character-form.view";
import { useCreateCharacter } from "./hooks/use-character";
import { CreateCharacterSchema, type CharacterFormValues } from "./character-schema";

const DEFAULT_STATS = {
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
};

interface CharacterFormContainerProps {
  userId: string;
  onCreated?: () => void;
}

export function CharacterFormContainer({ userId, onCreated }: CharacterFormContainerProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CharacterFormValues>({
    resolver: zodResolver(CreateCharacterSchema),
    defaultValues: { name: "", race: "Human", class: "Fighter", level: 1, stats: DEFAULT_STATS },
  });
  const createCharacter = useCreateCharacter();

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createCharacter.mutateAsync({ ...values, userId });
      reset();
      onCreated?.();
    } catch (err) {
      console.error("Erreur création personnage:", err);
    }
  });

  return (
    <CharacterFormView
      control={control}
      errors={errors}
      onFormSubmit={onSubmit}
      isSubmitting={isSubmitting || createCharacter.isPending}
    />
  );
}