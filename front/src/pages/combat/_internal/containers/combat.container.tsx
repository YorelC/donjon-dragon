import useLocalStorage from "@/shared/hooks/useLocalStorage";
import { Button } from "@/shared/components/atoms/button";
import { useCombat } from "../hooks/use-combat";
import { useRollDice } from "../queries/use-dice";
import { useCombatStore } from "../stores/combat.store";
import { DiceRollerView } from "../views/dice-roller.view";
import { CombatInitiativeView } from "../views/combat-initiative.view";
import { CombatLogView } from "../views/combat-log.view";
import type { Combatant } from "../types/combat-schema";

const DEMO_PARTICIPANTS: Combatant[] = [
  {
    id: "hero", name: "Aragorn", initiative: 18, armorClass: 15,
    hitPoints: { current: 30, max: 30 },
    stats: { strength: 16, dexterity: 14, constitution: 14, intelligence: 10, wisdom: 12, charisma: 10 },
    conditions: [],
  },
  {
    id: "goblin-1", name: "Gobelin", initiative: 10, armorClass: 13,
    hitPoints: { current: 7, max: 7 },
    stats: { strength: 8, dexterity: 14, constitution: 10, intelligence: 8, wisdom: 8, charisma: 8 },
    conditions: [],
  },
];

export function CombatContainer() {
  const [roomId] = useLocalStorage("dd-room-id", crypto.randomUUID());
  const { startCombat, rollDice, attack, nextTurn, endCombat } = useCombat(roomId);
  const rollDiceMutation = useRollDice();
  const currentCombat = useCombatStore((s) => s.currentCombat);

  const currentTurnId = currentCombat?.turnOrder[currentCombat.currentTurnIndex];
  const target = currentCombat?.participants.find((p) => p.id !== currentTurnId);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-6 md:grid-cols-2">
      <section className="space-y-4">
        {!currentCombat && (
          <Button onClick={() => startCombat(DEMO_PARTICIPANTS)}>Démarrer un combat de démonstration</Button>
        )}

        {currentCombat && (
          <>
            <CombatInitiativeView
              participants={currentCombat.participants}
              turnOrder={currentCombat.turnOrder}
              currentTurnIndex={currentCombat.currentTurnIndex}
              round={currentCombat.round}
            />
            <div className="flex gap-2">
              <Button
                disabled={!currentTurnId || !target}
                onClick={async () => {
                  const roll = await rollDice({ diceType: "d20", count: 1, modifier: 0 });
                  if (currentTurnId && target) {
                    attack(currentCombat.id, currentTurnId, target.id, roll.total);
                  }
                }}
              >
                Attaquer
              </Button>
              <Button variant="outline" onClick={() => nextTurn(currentCombat.id)}>
                Tour suivant
              </Button>
              <Button variant="destructive" onClick={() => endCombat(currentCombat.id)}>
                Terminer le combat
              </Button>
            </div>
          </>
        )}
      </section>

      <section className="space-y-4">
        <DiceRollerView
          onRoll={(payload) => rollDiceMutation.mutate(payload)}
          result={rollDiceMutation.data}
          isRolling={rollDiceMutation.isPending}
        />
        <CombatLogView entries={currentCombat?.log ?? []} />
      </section>
    </div>
  );
}
