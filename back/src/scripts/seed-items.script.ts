import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { connect } from 'mongoose';
import { ItemSchema as ItemContractSchema } from '@donjon-dragon/shared/item-schema';
import type { ItemDocument } from '@modules/items/infrastructure/persistence/item.mapper';
import { ItemSchema, ITEM_MODEL } from '@modules/items/infrastructure/persistence/item.schema';
import { MongoItemRepository } from '@modules/items/infrastructure/persistence/mongo-item.repository';
import { Item } from '@modules/items/domain/item';
import { ItemKey } from '@modules/items/domain/item-key';

/**
 * Le catalogue du manuel, en base.
 *
 * Les données viennent de `docs/characteres/equipment/items.seed.json`, produit
 * une fois depuis les quatre fichiers d'AideDD. Le seed valide ce qu'il lit :
 * un JSON édité à la main reste une entrée externe.
 */
const CATALOG_PATH = resolve(__dirname, '../../../docs/characteres/equipment/items.seed.json');

/**
 * Le fichier ne porte pas la provenance : tout ce qu'il contient est du manuel.
 * Il porte en revanche les statistiques de règle — dégâts, classe d'armure — car
 * c'est la collection qui en est la source de vérité, pas une constante.
 */
const SeedItemSchema = ItemContractSchema.omit({ source: true, campaignId: true });

function readCatalog(): Item[] {
  const raw: unknown = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  if (!Array.isArray(raw)) throw new Error('items.seed.json doit être un tableau');

  return raw.map((entry) =>
    Item.create({ ...SeedItemSchema.parse(entry), source: 'srd', campaignId: null }),
  );
}

async function seedItems(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/donjon-dragon';

  const items = readCatalog();
  const connection = await connect(mongoUri);
  const model = connection.model<ItemDocument>(ITEM_MODEL, ItemSchema);
  const repository = new MongoItemRepository(model);

  console.log(`🌱 Seeding ${items.length} items...\n`);

  // `save` fait un upsert sur (key, source, campaignId) : un rejeu met à jour
  // au lieu d'insérer un doublon. Aucun id à conserver, la clé EST l'identité.
  for (const item of items) {
    await repository.save(item);
  }

  // Le fichier fait foi : un objet renommé laisserait sinon son ancienne clé en
  // base, orpheline. Ce qu'une campagne a inventé n'est jamais touché.
  const pruned = await repository.pruneReferenceItems(items.map((item) => ItemKey.create(item.key)));
  if (pruned > 0) console.log(`🧹 ${pruned} objet(s) obsolète(s) retiré(s) du manuel\n`);

  console.log(summarize(items));
  console.log('\n✨ Seeding complete!');
  await connection.disconnect();
}

function summarize(items: Item[]): string {
  const byType = new Map<string, number>();
  for (const item of items) {
    byType.set(item.type, (byType.get(item.type) ?? 0) + 1);
  }
  return [...byType].map(([type, count]) => `  ${type} : ${count}`).join('\n');
}

seedItems().catch((err: unknown) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
