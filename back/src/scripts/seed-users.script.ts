import 'dotenv/config';
import { connect } from 'mongoose';
import type { Model } from 'mongoose';
import type { User } from '@donjon-dragon/shared/user-schema';
import { UserSchema, USER_MODEL } from '@modules/user/infrastructure/persistence/user.schema';
import { MongoUserRepository } from '@modules/user/infrastructure/persistence/mongo-user.repository';
import { BcryptPasswordHasher } from '@modules/auth/infrastructure/crypto/bcrypt-password-hasher';
import { createUser } from '@modules/user/domain/user.entity';

interface SeedUser {
  email: string;
  displayName: string;
  password: string;
}

const SEED_USERS: SeedUser[] = [
  { email: 'gandalf@middleearth.com', displayName: 'Gandalf', password: 'WizardOfMithrandir42' },
  { email: 'legolas@mirkwood.com', displayName: 'Legolas', password: 'BowmasterElf99' },
  { email: 'gimli@ironforge.com', displayName: 'Gimli', password: 'DwarfAxeMaster77' },
  { email: 'frodo@shire.com', displayName: 'Frodo', password: 'RingBearerHobbit88' },
  { email: 'aragorn@dunedain.com', displayName: 'Aragorn', password: 'RangerKing123' },
  { email: 'galadriel@rivendell.com', displayName: 'Galadriel', password: 'LadyOfLight456' },
  { email: 'elrond@rivendell.com', displayName: 'Elrond', password: 'HalfElvenLord789' },
  { email: 'arwen@rivendell.com', displayName: 'Arwen', password: 'StarryEve321' },
  { email: 'boromir@gondor.com', displayName: 'Boromir', password: 'GondorWarrior654' },
  { email: 'denethor@gondor.com', displayName: 'Denethor', password: 'StewardTomb987' },
];

async function seedUsers(): Promise<void> {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/donjon-dragon';

  const connection = await connect(mongoUri);
  const model = connection.model<User>(USER_MODEL, UserSchema);
  const repository = new MongoUserRepository(model);
  const passwordHasher = new BcryptPasswordHasher();

  console.log('🌱 Seeding users...\n');

  for (const seedUser of SEED_USERS) {
    const hashedPassword = await passwordHasher.hash(seedUser.password);
    const user = createUser({
      email: seedUser.email,
      displayName: seedUser.displayName,
      passwordHash: hashedPassword,
    });

    await repository.save(user);
    console.log(`✅ ${seedUser.displayName} | password: ${seedUser.password}`);
  }

  console.log('\n✨ Seeding complete!');
  await connection.disconnect();
}

seedUsers().catch((err: unknown) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
