import { MongoClient, type Collection, type Db } from "mongodb";
import { MealRecord, SessionRecord, UserRecord } from "@/lib/types";

const DEFAULT_MONGODB_URI =
  "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.4.2";
const DB_NAME = process.env.MONGODB_DB || "nutrilens";

type MongoGlobal = typeof globalThis & {
  _nutrilensMongoClient?: Promise<MongoClient>;
  _nutrilensMongoIndexes?: Promise<void>;
};

type Collections = {
  users: Collection<UserRecord>;
  sessions: Collection<SessionRecord>;
  meals: Collection<MealRecord>;
};

const mongoGlobal = globalThis as MongoGlobal;

async function getClient() {
  if (!mongoGlobal._nutrilensMongoClient) {
    const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;
    mongoGlobal._nutrilensMongoClient = new MongoClient(uri).connect();
  }

  return mongoGlobal._nutrilensMongoClient;
}

async function getDatabase(): Promise<Db> {
  const client = await getClient();
  return client.db(DB_NAME);
}

async function getCollections(): Promise<Collections> {
  const db = await getDatabase();
  await ensureIndexes(db);

  return {
    users: db.collection<UserRecord>("users"),
    sessions: db.collection<SessionRecord>("sessions"),
    meals: db.collection<MealRecord>("meals"),
  };
}

async function ensureIndexes(db: Db) {
  if (!mongoGlobal._nutrilensMongoIndexes) {
    mongoGlobal._nutrilensMongoIndexes = Promise.all([
      db.collection<UserRecord>("users").createIndex({ email: 1 }, { unique: true }),
      db.collection<UserRecord>("users").createIndex({ id: 1 }, { unique: true }),
      db.collection<SessionRecord>("sessions").createIndex({ token: 1 }, { unique: true }),
      db.collection<SessionRecord>("sessions").createIndex({ userId: 1 }),
      db.collection<MealRecord>("meals").createIndex({ userId: 1, createdAt: -1 }),
    ]).then(() => undefined);
  }

  await mongoGlobal._nutrilensMongoIndexes;
}

export async function findUserByEmail(email: string) {
  const { users } = await getCollections();
  return users.findOne({ email: email.toLowerCase() }, { projection: { _id: 0 } });
}

export async function findUserById(userId: string) {
  const { users } = await getCollections();
  return users.findOne({ id: userId }, { projection: { _id: 0 } });
}

export async function createUser(user: UserRecord) {
  const { users } = await getCollections();
  await users.insertOne(user);
  return user;
}

export async function updateUser(updatedUser: UserRecord) {
  const { users } = await getCollections();
  await users.updateOne(
    { id: updatedUser.id },
    { $set: updatedUser },
    { upsert: false }
  );
  return updatedUser;
}

export async function createSession(session: SessionRecord) {
  const { sessions } = await getCollections();
  await sessions.deleteMany({ userId: session.userId });
  await sessions.insertOne(session);
  return session;
}

export async function findSession(token: string) {
  const { sessions } = await getCollections();
  return sessions.findOne({ token }, { projection: { _id: 0 } });
}

export async function deleteSession(token: string) {
  const { sessions } = await getCollections();
  await sessions.deleteOne({ token });
}

export async function createMeal(meal: MealRecord) {
  const { meals } = await getCollections();
  await meals.insertOne(meal);
  return meal;
}

export async function getMealsForUser(userId: string) {
  const { meals } = await getCollections();
  return meals
    .find({ userId }, { projection: { _id: 0 } })
    .sort({ createdAt: -1 })
    .toArray();
}
