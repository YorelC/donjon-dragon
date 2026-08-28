import { describe, expect, it } from "vitest";
import { RealtimeMessageCache } from "./realtime-message-cache";

describe("RealtimeMessageCache", () => {
  it("ignore une seconde livraison du même message", () => {
    const cache = new RealtimeMessageCache();

    expect(cache.accept("message-1")).toBe(true);
    expect(cache.accept("message-1")).toBe(false);
  });

  it("borne la mémoire et finit par oublier le plus ancien message", () => {
    const cache = new RealtimeMessageCache();
    for (let index = 0; index <= 256; index += 1) {
      cache.accept(`message-${index}`);
    }

    expect(cache.accept("message-0")).toBe(true);
  });
});
