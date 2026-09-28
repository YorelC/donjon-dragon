import { describe, it, expect, afterEach } from "vitest";
import { useLeaveGuardStore } from "./leave-guard.store";

const guard = () => useLeaveGuardStore.getState();

describe("useLeaveGuardStore", () => {
  afterEach(() => guard().disarm());

  it("naît désarmée, sans demande", () => {
    expect(guard().isArmed).toBe(false);
    expect(guard().pendingTo).toBeNull();
  });

  it("retient la destination demandée, jusqu'à l'annulation", () => {
    guard().arm();
    guard().request("/campaigns");
    expect(guard().pendingTo).toBe("/campaigns");

    guard().cancel();
    expect(guard().pendingTo).toBeNull();
    expect(guard().isArmed).toBe(true);
  });

  // L'écran gardé part : sa demande en suspens ne doit pas survivre au suivant.
  it("oublie la demande en se désarmant", () => {
    guard().arm();
    guard().request("/campaigns");

    guard().disarm();

    expect(guard().isArmed).toBe(false);
    expect(guard().pendingTo).toBeNull();
  });
});
