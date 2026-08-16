import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connect } from 'mongoose';
import { MonsterSchema as MonsterContractSchema } from '@donjon-dragon/shared/monster-schema';
import type { MonsterDocument } from '@modules/bestiary/infrastructure/persistence/monster.mapper';
import {
  MonsterSchema,
  MONSTER_MODEL,
} from '@modules/bestiary/infrastructure/persistence/monster.schema';
import { MongoMonsterRepository } from '@modules/bestiary/infrastructure/persistence/mongo-monster.repository';
import { Monster } from '@modules/bestiary/domain/monster';

/**
 * Le bestiaire du manuel, en base.
 *
 * Les données viennent de `docs/characteres/bestiary/monsters.seed.json`, extrait
 * une fois d'AideDD. Le seed valide ce qu'il lit : un JSON produit par un
 * pipeline reste une entrée externe, et celui-ci a déjà livré des profils sans
 * caractéristiques.
 */
const BESTIARY_PATH = resolve(__dirname, '../../../docs/characteres/bestiary/monsters.seed.json');

/** Le fichier ne porte pas la provenance : tout ce qu'il contient est du manuel. */
const SeedMonsterSchema = MonsterContractSchema.omit({ origin: true, campaignId: true });

function readBestiary(): Monster[] {
  const raw: unknown = JSON.parse(readFileSync(BESTIARY_PATH, 'utf8'));
  if (!Array.isArray(raw)) throw new Error('monsters.seed.json doit être un tableau');

  return raw.map((entry) =>
    Monster.create({ ...SeedMonsterSchema.parse(entry), origin: 'srd', campaignId: null }),
  );
}

async function seedMonsters(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/donjon-dragon';

  const monsters = readBestiary();
  const connection = await connect(mongoUri);
  const model = connection.model<MonsterDocument>(MONSTER_MODEL, MonsterSchema);
  const repository = new MongoMonsterRepository(model);

  console.log(`🐉 Seeding ${monsters.length} monsters...\n`);

  // `save` fait un upsert sur (key, origin, campaignId) : un rejeu met à jour au
  // lieu d'insérer un doublon. Aucun id à conserver, la clé EST l'identité.
  for (const monster of monsters) {
    await repository.save(monster);
  }

  console.log(summarize(monsters));
  console.log('\n✨ Seeding complete!');
  await connection.disconnect();
}

/** Un bestiaire se lit par facteur de puissance : c'est ce qu'un MJ cherche. */
function summarize(monsters: Monster[]): string {
  const byRating = new Map<string, number>();
  for (const monster of monsters) {
    const rating = monster.challengeRating ?? 'sans FP';
    byRating.set(rating, (byRating.get(rating) ?? 0) + 1);
  }

  return [...byRating]
    .sort(byRatingOrder)
    .map(([rating, count]) => `  FP ${rating} : ${count}`)
    .join('\n');
}

const NO_RATING_LAST = Number.MAX_SAFE_INTEGER;

function byRatingOrder(left: [string, number], right: [string, number]): number {
  return ratingValue(left[0]) - ratingValue(right[0]);
}

function ratingValue(rating: string): number {
  if (rating === 'sans FP') return NO_RATING_LAST;
  const [numerator, denominator] = rating.split('/');
  return Number(numerator) / Number(denominator ?? 1);
}

seedMonsters().catch((err: unknown) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
