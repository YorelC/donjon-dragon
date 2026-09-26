import type { Item } from "@donjon-dragon/shared";
import type { CharacterComposition } from "../types/character-composition";
import type { StepBinding } from "../types/step-binding";
import { backgroundEquipmentOptions, classEquipmentOptions, grantedItems,
  ownedArmors, ownedShield } from "../types/starting-equipment";
import { EquipmentOptionGroupView } from "./equipment-option-group.view";
import { TrinketChoiceView } from "./trinket-choice.view";
import { WornEquipmentView } from "./worn-equipment.view";

interface EquipmentStepViewProps {
  binding: StepBinding;
  items: Item[];
}

/**
 * L'équipement de départ des règles 2024 : on prend l'option A, B ou C de sa
 * classe et celle de son historique, ou bien l'or. On ne choisit pas son armure
 * dans une vitrine — on porte ce que le paquetage a donné.
 */
export function EquipmentStepView({ binding, items }: EquipmentStepViewProps) {
  const { catalog, composition, onChange } = binding;
  const granted = grantedItems(catalog, composition);

  return (
    <div className="flex flex-col gap-6">
      <EquipmentOptionGroupView
        group="class"
        options={classEquipmentOptions(catalog, composition)}
        selection={{
          selectedId: composition.classEquipmentOptionId,
          selectedItemKey: composition.classChoiceItemKey,
          onSelect: (optionId) => onChange(resetClassPackage(optionId)),
          onItemSelect: (classChoiceItemKey) => onChange({ classChoiceItemKey }),
          onPreview: binding.preview,
        }}
      />
      <EquipmentOptionGroupView
        group="background"
        options={backgroundEquipmentOptions(catalog, composition)}
        selection={{
          selectedId: composition.backgroundEquipmentOptionId,
          selectedItemKey: composition.backgroundChoiceItemKey,
          onSelect: (optionId) => onChange(resetBackgroundPackage(optionId)),
          onItemSelect: (backgroundChoiceItemKey) => onChange({ backgroundChoiceItemKey }),
          onPreview: binding.preview,
        }}
      />
      <WornEquipmentView
        worn={{ armors: ownedArmors(items, granted), shield: ownedShield(items, granted) }}
        binding={binding}
      />
      <TrinketChoiceView
        trinkets={catalog.trinkets}
        selectedId={composition.trinketId}
        onSelect={(trinketId) => onChange({ trinketId })}
      />
    </div>
  );
}

/**
 * Changer d'option change ce qu'on possède : garder l'armure précédente ferait
 * porter au personnage une pièce qui ne lui appartient plus.
 */
function resetWorn(patch: Partial<CharacterComposition>): Partial<CharacterComposition> {
  return { ...patch, armorKey: null, shield: false };
}

function resetClassPackage(optionId: string): Partial<CharacterComposition> {
  return resetWorn({ classEquipmentOptionId: optionId, classChoiceItemKey: null });
}

function resetBackgroundPackage(optionId: string): Partial<CharacterComposition> {
  return resetWorn({ backgroundEquipmentOptionId: optionId, backgroundChoiceItemKey: null });
}
