import { z } from "zod";

export const StatsSchema = z.object({
  strength: z.number().int().min(3).max(20),
  dexterity: z.number().int().min(3).max(20),
  constitution: z.number().int().min(3).max(20),
  intelligence: z.number().int().min(3).max(20),
  wisdom: z.number().int().min(3).max(20),
  charisma: z.number().int().min(3).max(20),
});

export type Stats = z.infer<typeof StatsSchema>;
