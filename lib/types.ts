export interface UserProfile {
  height: string;
  weight: string;
  gender: string;
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
  name: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
  servingSize: string;
  confidence: number;
  createdAt: string;
}

export interface DatabaseShape {
  users: UserRecord[];
  sessions: SessionRecord[];
  meals: MealRecord[];
}
