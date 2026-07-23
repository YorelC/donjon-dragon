import { beforeEach, describe, expect, it } from "vitest";
import { useCharacterStore } from "./character.store";

describe("useCharacterStore", () => {
  beforeEach(() => {
    useCharacterStore.setState({ selectedCharacterId: null });
  });

  it("has no selected character by default", () => {
    expect(useCharacterStore.getState().selectedCharacterId).toBeNull();
  });

  it("selects a character by id", () => {
    useCharacterStore.getState().selectCharacter("char-1");
    expect(useCharacterStore.getState().selectedCharacterId).toBe("char-1");
  });

  it("clears the selection when passed null", () => {
    useCharacterStore.getState().selectCharacter("char-1");
    useCharacterStore.getState().selectCharacter(null);
    expect(useCharacterStore.getState().selectedCharacterId).toBeNull();
  });
});
