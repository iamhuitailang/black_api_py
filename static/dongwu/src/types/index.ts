export type AnimalType = 'rabbit' | 'cat' | 'dog' | 'bear' | 'panda' | 'fox' | 'hamster' | 'penguin';

export type Personality = '活泼' | '安静' | '调皮' | '温柔' | '好奇' | '贪吃' | '忠诚' | '聪明';

export type Talent = '绘画' | '音乐' | '运动' | '认知' | '全能';

export type Weather = 'sunny' | 'rainy' | 'cloudy';

export type CourseType = 'painting' | 'music' | 'sports' | 'cognition';

export type FoodCategory = 'fruit' | 'dairy' | 'meat' | 'snack' | 'vegetable';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening';

export interface Animal {
  id: string;
  name: string;
  type: AnimalType;
  emoji: string;
  color: string;
  level: number;
  exp: number;
  maxExp: number;
  happiness: number;
  intelligence: number;
  energy: number;
  hunger: number;
  affection: number;
  personality: Personality;
  favoriteFood: string;
  talent: Talent;
  isSleeping: boolean;
  isGraduated: boolean;
  lastFed: number;
  lastPlayed: number;
  sleepStartTime?: number;
  actions: string[];
  skills: string[];
}

export interface Food {
  id: string;
  name: string;
  emoji: string;
  category: FoodCategory;
  price: number;
  hungerRestore: number;
  happinessBonus: number;
}

export interface Course {
  id: string;
  name: string;
  type: CourseType;
  emoji: string;
  duration: number;
  energyCost: number;
  expGain: number;
  intelligenceGain: number;
  happinessChange: number;
  minLevel: number;
}

export interface Decoration {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
  isPurchased: boolean;
}

export interface Toy {
  id: string;
  name: string;
  emoji: string;
  price: number;
  happinessBonus: number;
  energyCost: number;
}

export interface GameState {
  coins: number;
  day: number;
  timeOfDay: TimeOfDay;
  weather: Weather;
  animals: Animal[];
  inventory: Record<string, number>;
  decorations: string[];
  toys: string[];
  totalGraduated: number;
  lastSave: number;
  gameStartTime: number;
  pendingActivity: PendingActivity | null;
}

export interface Activity {
  id: string;
  name: string;
  emoji: string;
  description: string;
  coinReward: number;
  happinessBonus: number;
  duration: number;
}

export type PendingActivityType = 'class' | 'activity' | 'sleep';

export interface PendingActivity {
  type: PendingActivityType;
  activityId: string;
  animalId?: string;
  startTime: number;
  duration: number;
  snapshot: {
    energyCost?: number;
    courseId?: string;
  };
}
