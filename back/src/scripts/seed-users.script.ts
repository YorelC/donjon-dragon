import 'dotenv/config';
import { connect } from 'mongoose';
import type { UserDocument } from '@modules/user/infrastructure/persistence/user.mapper';
import { UserSchema, USER_MODEL } from '@modules/user/infrastructure/persistence/user.schema';
import { MongoUserRepository } from '@modules/user/infrastructure/persistence/mongo-user.repository';
import { BcryptPasswordHasher } from '@modules/auth/infrastructure/crypto/bcrypt-password-hasher';
import { DisplayName } from '@modules/user/domain/display-name';
import { Email } from '@modules/user/domain/email';
import { User } from '@modules/user/domain/user';

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
  const model = connection.model<UserDocument>(USER_MODEL, UserSchema);
  const repository = new MongoUserRepository(model);
  const passwordHasher = new BcryptPasswordHasher();

  console.log('🌱 Seeding users...\n');

  for (const seedUser of SEED_USERS) {
    const user = await buildVerifiedUser(seedUser, passwordHasher, repository);
    await repository.save(user);
    console.log(`✅ ${seedUser.displayName} | password: ${seedUser.password}`);
  }

  console.log('\n✨ Seeding complete!');
  await connection.disconnect();
}

/**
 * Le seed doit être rejouable. `save` faisant un upsert par `id`, un compte
 * regénéré avec un id neuf tombait sur l'index unique de l'email : le second
 * lancement échouait toujours en DuplicateKey. On réutilise donc l'id existant,
 * ce qui met à jour le compte au lieu d'en insérer un doublon — et préserve les
 * amitiés qui référencent cet id.
 */
async function buildVerifiedUser(
  seedUser: SeedUser,
  passwordHasher: BcryptPasswordHasher,
  repository: MongoUserRepository,
): Promise<User> {
  const email = Email.create(seedUser.email);
  const passwordHash = await passwordHasher.hash(seedUser.password);

  const existing = await repository.findByEmail(email);
  if (existing) {
    return User.restore({ ...existing.snapshot(), passwordHash, emailVerified: true });
  }

  const user = User.register({
    email,
    displayName: DisplayName.create(seedUser.displayName),
    passwordHash,
  });

  // Sans ça, aucun compte seedé ne peut se connecter : le login exige un email
  // vérifié, et il n'y a pas de mail à cliquer en local. Le seed était donc
  // inutilisable pour se connecter en développement.
  user.markEmailVerified();

  return user;
}

seedUsers().catch((err: unknown) => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
