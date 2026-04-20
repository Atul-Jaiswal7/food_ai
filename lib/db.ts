import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { DatabaseShape, MealRecord, SessionRecord, UserRecord } from "@/lib/types";

const DB_DIRECTORY = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIRECTORY, "nutrilens-db.json");

const defaultDatabase = (): DatabaseShape => ({
  users: [],
  sessions: [],
  meals: [],
});

let writeQueue = Promise.resolve();

async function ensureDbFile() {
  await mkdir(DB_DIRECTORY, { recursive: true });

  try {
    await readFile(DB_PATH, "utf8");
  } catch {
    await writeFile(DB_PATH, JSON.stringify(defaultDatabase(), null, 2), "utf8");
  }
}

export async function readDatabase(): Promise<DatabaseShape> {
  await ensureDbFile();
  const raw = await readFile(DB_PATH, "utf8");

  try {
    const parsed = JSON.parse(raw) as Partial<DatabaseShape>;
    return {
      users: parsed.users ?? [],
      sessions: parsed.sessions ?? [],
      meals: parsed.meals ?? [],
    };
  } catch {
    return defaultDatabase();
  }
}

export async function writeDatabase(data: DatabaseShape) {
  await ensureDbFile();
  writeQueue = writeQueue.then(() =>
    writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf8")
  );
  await writeQueue;
}

export async function findUserByEmail(email: string) {
  const db = await readDatabase();
  return db.users.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(userId: string) {
  const db = await readDatabase();
  return db.users.find((user) => user.id === userId) ?? null;
}

export async function createUser(user: UserRecord) {
  const db = await readDatabase();
  db.users.push(user);
  await writeDatabase(db);
  return user;
}

export async function updateUser(updatedUser: UserRecord) {
  const db = await readDatabase();
  db.users = db.users.map((user) => (user.id === updatedUser.id ? updatedUser : user));
  await writeDatabase(db);
  return updatedUser;
}

export async function createSession(session: SessionRecord) {
  const db = await readDatabase();
  db.sessions = db.sessions.filter((entry) => entry.userId !== session.userId);
  db.sessions.push(session);
  await writeDatabase(db);
  return session;
}

export async function findSession(token: string) {
  const db = await readDatabase();
  return db.sessions.find((session) => session.token === token) ?? null;
}

export async function deleteSession(token: string) {
  const db = await readDatabase();
  db.sessions = db.sessions.filter((session) => session.token !== token);
  await writeDatabase(db);
}

export async function createMeal(meal: MealRecord) {
  const db = await readDatabase();
  db.meals.unshift(meal);
  await writeDatabase(db);
  return meal;
}

export async function getMealsForUser(userId: string) {
  const db = await readDatabase();
  return db.meals.filter((meal) => meal.userId === userId);
}
