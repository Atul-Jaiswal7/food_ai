export interface UserProfile {
  age: string;
  height: string;
  weight: string;
  gender: string;
  intakeTargets: NutrientTargets;
  intakeSource: "gemini" | "manual" | "fallback";
  intakeUpdatedAt: string;
}

export interface NutrientTargets {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
  potassium: string;
  calcium: string;
  iron: string;
  vitaminA: string;
  vitaminC: string;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  profile: UserProfile;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

export interface MealRecord {
  id: string;
  userId: string;
  groupId: string;
  groupName: string;
  quantity: number;
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  sugar: string;
  sodium: string;
  potassium: string;
  calcium: string;
  iron: string;
  vitaminA: string;
  vitaminC: string;
  servingSize: string;
  confidence: number;
  createdAt: string;
}

export interface DatabaseShape {
  users: UserRecord[];
  sessions: SessionRecord[];
  meals: MealRecord[];
}
