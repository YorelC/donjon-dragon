import type { CatalogLanguage, DndCatalog, Language } from "@donjon-dragon/shared";
import { Badge } from "@/shared/components/atoms/badge";
import { Button } from "@/shared/components/atoms/button";
import { STANDARD_LANGUAGE_QUOTA } from "../types/builder-validity";
import type { CharacterComposition } from "../types/character-composition";

interface LanguagesStepViewProps {
  catalog: DndCatalog;
  composition: CharacterComposition;
  onChange: (patch: Partial<CharacterComposition>) => void;
}

/**
 * Les deux langues standards de la création.
 *
 * La liste vient du serveur : ni le Commun, déjà connu, ni les langues rares,
 * qui relèvent d'autres sources — la langue supplémentaire du Roublard, par
 * exemple. Le front ne redit pas ces listes, il les reçoit.
 */
export function LanguagesStepView({ catalog, composition, onChange }: LanguagesStepViewProps) {
  const chosen = composition.standardLanguages;

  return (
    <div className="grid gap-2">
      <p className="text-sm text-muted-foreground">
        Choisissez {STANDARD_LANGUAGE_QUOTA} langues. Le Commun vous est déjà connu.{" "}
        <Badge variant="outline">
          {chosen.length} / {STANDARD_LANGUAGE_QUOTA}
        </Badge>
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {catalog.languages.standard.map((language) => (
          <LanguageToggle
            key={language.key}
            language={language}
            chosen={chosen}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

interface LanguageToggleProps {
  language: CatalogLanguage;
  chosen: readonly Language[];
  onChange: (patch: Partial<CharacterComposition>) => void;
}

function LanguageToggle({ language, chosen, onChange }: LanguageToggleProps) {
  const selected = chosen.includes(language.key);
  const full = chosen.length >= STANDARD_LANGUAGE_QUOTA;

  return (
    <Button
      type="button"
      size="sm"
      aria-pressed={selected}
      variant={selected ? "default" : "outline"}
      disabled={full && !selected}
      onClick={() => onChange({ standardLanguages: toggle(chosen, language.key) })}
    >
      {language.name}
    </Button>
  );
}

function toggle(chosen: readonly Language[], language: Language): Language[] {
  return chosen.includes(language)
    ? chosen.filter((entry) => entry !== language)
    : [...chosen, language];
}
