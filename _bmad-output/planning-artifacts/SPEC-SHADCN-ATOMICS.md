# SPEC-SHADCN-ATOMICS.md

## Analyse de l'état actuel du projet donjon-dragon

### Configuration shadcn/ui v4

| Élément | Status | Notes |
|---------|--------|-------|
| `@shadcn/react` | ✅ installé | version ^0.2.1 |
| Tailwind v4 | ✅ configuré | via `@tailwindcss/vite` ^4.3.3, pas de `tailwind.config.js` |
| `index.css` | ✅ correct | contient `@import "tailwindcss"` |
| `components.json` | ✅ configuré | style `new-york`, alias `@/components/ui` |
| Vite | ✅ configuré | plugins `tailwindcss()` et `react()` |

### Composants ui installés (via shadcn registry)

| Catégorie | Composants |
|-----------|------------|
| Base | `avatar`, `badge`, `button`, `card`, `checkbox`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `radio-group`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `sonner`, `table`, `tabs`, `textarea`, `tooltip`, `alert`, `alert-dialog`, `menubar`, `accordion`, `collapsible`, `switch`, `command`, `popover` |
| Total | **31** composants |

### Composants manquants (pour D&D 5e)

| Composant | Priorité | Description |
|-----------|----------|-------------|
| `dice-roller` | 🔴 CRITICAL | Composant principal pour les lancers de dés (D4, D6, D8, D10, D12, D20) |
| `character-sheet` | 🔴 CRITICAL | Formulaire complet de création/modification de personnage |
| `combat-log` | 🟠 HIGH | Affichage des résultats de combat (dégâts, sauvegardes, etc.) |
| `spell-card` | 🟠 HIGH | Carte détaillée d'un sort (nom, niveaux, école, portsée, description) |
| `item-card` | 🟡 MEDIUM | Carte pour objets (armes, armures, consommables) |
| `ability-score` | 🟡 MEDIUM | Affichage des 6 compétences (FOR, DEX, CON, INT, SAG, CHA) |
| `skill-check` | 🟡 MEDIUM | Roll de compétence avec bonus et critique |
| `hit-points` | 🟡 MEDIUM | Barre de points de vie avec current/max |
| `initiative` | 🟡 MEDIUM | Ordre d'initiative avec orderable list |
| `condition-badge` | 🟢 LOW | Indicateurs de statuts (poisoné, étourdi, etc.) |

---

## Spécifications techniques des composants D&D à créer

### 1. Dice Roller (`src/components/ui/dice-roller.tsx`)

```tsx
// dice-roller.tsx
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"

// Types
type DieType = 4 | 6 | 8 | 10 | 12 | 20
interface DiceRoll {
  die: DieType
  quantity: number
  modifier: number
  rolls: number[]
  total: number
  isCrit?: boolean
  isFail?: boolean
}

// Main Component
export function DiceRoller() {
  const [rolls, setRolls] = useState<DiceRoll[]>([])
  
  // Roll handler with D&D crit rules for D20
  const rollDice = (die: DieType, qty: number, mod: number) => { ... }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lancers de dés</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Dice buttons grid (D4, D6, D8, D10, D12, D20) */}
        {/* Roll history */}
      </CardContent>
    </Card>
  )
}
```

**Fonctionnalités :**
- Boutons pour chaque type de dé (D4-D20)
- Sélection du nombre de dés (1-10)
- Modificateur (bonus/malus)
- Affichage des résultats détaillés (chaque dés + modifier)
- Critique automatique pour D20 (1 = échec critique, 20 = réussite critique)
- Historique des lancers récents

---

### 2. Character Sheet (`src/components/ui/character-sheet.tsx`)

```tsx
// character-sheet.tsx
import { DiceRoller } from "@/components/ui/dice-roller"
import { AbilityScore } from "@/components/ui/ability-score"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Types
interface CharacterStats {
  name: string
  race: string
  class: string
  level: number
  hp: { current: number; max: number }
  ac: number
  speed: number
  abilities: {
    str: number
    dex: number
    con: number
    int: number
    wis: number
    cha: number
  }
  skills: Record<string, number>
  spells: Spell[]
  inventory: Item[]
}

// Main Component
export function CharacterSheet({ character }: { character: CharacterStats }) {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        <TabsTrigger value="general">Général</TabsTrigger>
        <TabsTrigger value="abilities">Compétences</TabsTrigger>
        <TabsTrigger value="spells">Sorts</TabsTrigger>
        <TabsTrigger value="inventory">Inventaire</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general">...</TabsContent>
      <TabsContent value="abilities">
        <AbilityScore label="Force" value={character.abilities.str} mod={2} />
        {/* 5 other abilities */}
      </TabsContent>
      {/* Other tabs */}
    </Tabs>
  )
}
```

**Fonctionnalités :**
- Onglets pour général, compétences, sorts, inventaire
- Affichage des 6 compétences (FOR, DEX, CON, INT, SAG, CHA) avec modificateurs
- Barre de PV (current/max)
- CA, Vitesse
- Modale pour édition des stats

---

### 3. Combat Log (`src/components/ui/combat-log.tsx`)

```tsx
// combat-log.tsx
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

interface CombatEvent {
  id: string
  timestamp: Date
  type: "damage" | "heal" | "attack" | "save" | "crit" | "fail"
  source: string
  target: string
  message: string
  value?: number
}

export function CombatLog({ events }: { events: CombatEvent[] }) {
  return (
    <ScrollArea className="h-[500px]">
      <div className="space-y-2">
        {events.map((event) => (
          <Alert key={event.id} variant={event.type === "crit" ? "default" : "outline"}>
            <AlertDescription className={cn(
              event.type === "crit" ? "text-green-600 font-bold" : "",
              event.type === "fail" ? "text-red-600 font-bold" : ""
            )}>
              {event.message} {event.value !== undefined && `(${event.value})`}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    </ScrollArea>
  )
}
```

**Fonctionnalités :**
- Scroll area pour les événements
- Styles visuels pour critiques/échecs critiques
- Timestamps
- Filtres par type d'événement

---

### 4. Spell Card (`src/components/ui/spell-card.tsx`)

```tsx
// spell-card.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

// Types
interface Spell {
  id: string
  name: string
  level: number
  school: "Transmutation" | "Evocation" | "Conjuration" | "Illusion" | "Nécromancie" | "Abjuration" | "Divination" | "Enchantement"
  castTime: string
  range: string
  components: string
  duration: string
  description: string
  higherLevels?: string
}

export function SpellCard({ spell }: { spell: Spell }) {
  const schoolColors = {
    "Transmutation": "bg-yellow-500",
    "Evocation": "bg-red-500",
    "Conjuration": "bg-blue-500",
    "Illusion": "bg-purple-500",
    "Nécromancie": "bg-gray-600",
    "Abjuration": "bg-cyan-500",
    "Divination": "bg-indigo-500",
    "EnchanteMENT": "bg-pink-500"
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>{spell.name}</CardTitle>
          <Badge className={schoolColors[spell.school]}>{spell.level}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <strong>École:</strong> {spell.school} • <strong>Niveau:</strong> {spell.level} • <strong>Temps:</strong> {spell.castTime} • <strong>Portée:</strong> {spell.range}
        </p>
        <p>{spell.description}</p>
        {spell.higherLevels && <p className="text-sm italic">{spell.higherLevels}</p>}
        <Button variant="outline" size="sm" className="mt-2">Lancer le sort</Button>
      </CardContent>
    </Card>
  )
}
```

**Fonctionnalités :**
- Design "card" pour chaque sort
- Badge de niveau et école avec couleurs D&D
- Informations techniques (temps, portée, composants, durée)
- Bouton "Lancer le sort" pour ouvrir le dice-roller

---

### 5. Ability Score (`src/components/ui/ability-score.tsx`)

```tsx
// ability-score.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

interface AbilityScoreProps {
  label: string
  value: number
  mod?: number
  onRoll?: (mod: number) => void
}

export function AbilityScore({ label, value, mod, onRoll }: AbilityScoreProps) {
  const modifier = mod ?? Math.floor((value - 10) / 2)
  const sign = modifier >= 0 ? "+" : ""
  
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-3">
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-xs text-muted-foreground">{value} ({sign}{modifier})</div>
        </div>
        {onRoll && (
          <Button size="sm" onClick={() => onRoll(modifier)}>
            <span className="mr-1">🎲</span> Lancer
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
```

---

### 6. Hit Points (`src/components/ui/hit-points.tsx`)

```tsx
// hit-points.tsx
import { Progress } from "@/components/ui/progress"

interface HitPointsProps {
  current: number
  max: number
}

export function HitPoints({ current, max }: HitPointsProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100))
  const color = percentage > 50 ? "green" : percentage > 25 ? "yellow" : "red"
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span className="font-semibold">Points de vie</span>
        <span>{current} / {max}</span>
      </div>
      <Progress value={percentage} className={`h-2 bg-${color}-100`} />
    </div>
  )
}
```

---

## Structure recommandée pour le projet

```
src/
├── components/
│   ├── ui/                          # shadcn/ui v4 components
│   │   ├── [existing].tsx
│   │   ├── dice-roller.tsx          # NOUVEAU
│   │   ├── character-sheet.tsx      # NOUVEAU
│   │   ├── combat-log.tsx           # NOUVEAU
│   │   ├── spell-card.tsx           # NOUVEAU
│   │   ├── item-card.tsx            # NOUVEAU
│   │   ├── ability-score.tsx        # NOUVEAU
│   │   ├── skill-check.tsx          # NOUVEAU
│   │   ├── hit-points.tsx           # NOUVEAU
│   │   ├── initiative.tsx           # NOUVEAU
│   │   └── condition-badge.tsx      # NOUVEAU
│   └── routes/
│       ├── Home.tsx
│       └── ...
└── hooks/
    └── useLocalStorage.tsx
```

---

## Étapes d'implémentation recommandées

1. ✅ **Phase 1 - Composants de base** (1-2 semaines)
   - Dice Roller (le plus critique)
   - Ability Score
   - Hit Points
   - Skill Check

2. ✅ **Phase 2 - Composants de présentation** (1 semaine)
   - Spell Card
   - Item Card
   - Combat Log

3. ✅ **Phase 3 - Composants complexes** (1-2 semaines)
   - Character Sheet (combinaison de plusieurs composants)
   - Initiative (list ordonnable)

4. ✅ **Phase 4 - Finitions** (3-5 jours)
   - Tests unitaires
   - Responsive design
   - Accessibilité (a11y)

---

## Notes techniques

- **Tailwind v4** : Utiliser `@import "tailwindcss"` (pas de `tailwind.config.js`)
- **shadcn/ui v4** : Les composants sont installés via `npx shadcn@latest add [composant]`
- **Alias** : `@/components/ui` → `src/components/ui/`
- **Lib utils** : Créer `src/lib/utils.ts` pour `cn()` helper
- **Styling** : Respecter le style `new-york` du composant `components.json`

---

## Conclusion

Le projet est **prêt pour l'extension** avec les composants D&D spécifiques. Les 31 composants de base shadcn/ui sont installés et configurés. Il reste à créer **10 composants atomiques** spécifiques au thème RPG D&D 5e, principalement autour du **Dice Roller**, du **Character Sheet**, et de l'affichage des **Sorts**.

Le calendrier estimé est de **4-6 semaines** pour l'implémentation complète.
