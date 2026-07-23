export type DrugType = 'marijuana' | 'mushroom' | 'cocaine' | 'meth' | 'lsd' | 'ecstasy';

export type PlantStage = 'seed' | 'seedling' | 'vegetative' | 'flowering' | 'ready';

export type StaffType = 'grower' | 'dealer' | 'security' | 'researcher';

export type EventType = 'pest' | 'mold' | 'yerbon' | 'raid' | 'vip_buyer' | 'special_offer' | 'cross_pollination';

export type SellMethod = 'local' | 'dealer_sale' | 'darknet' | 'export';

export type EquipmentType = 'lights' | 'ventilation' | 'irrigation' | 'security';

export interface Strain {
  id: string;
  name: string;
  drugType: DrugType;
  growTimeMinutes: number;
  baseValue: number;
  baseYield: number;
  difficulty: number;
  unlockLevel: number;
  description: string;
  specialTrait: string;
  idealWater: number;
  idealLight: number;
  idealNutrients: number;
  seedCost: number;
  substrate?: string;
  icon: string;
  color: string;
}

export interface Plant {
  id: string;
  gameId: string;
  growSpaceId: string;
  strainId: string;
  strain?: Strain;
  plantedAt: string;
  stage: PlantStage;
  stageProgress: number;
  waterLevel: number;
  lightLevel: number;
  nutrientLevel: number;
  health: number;
  quality: number;
  isYerbon: boolean;
  isMoldy: boolean;
  hasPests: boolean;
  harvestedAt: string | null;
  slot: number;
  waterDecayRate: number;
  lightDecayRate: number;
  nutrientDecayRate: number;
}

export interface GrowSpace {
  id: string;
  gameId: string;
  name: string;
  level: number;
  capacity: number;
  drugType: DrugType;
  lights: number;
  ventilation: number;
  irrigation: number;
  security: number;
  unlocked: boolean;
}

export interface InventoryItem {
  id: string;
  gameId: string;
  strainId: string;
  strain?: Strain;
  quantity: number;
  averageQuality: number;
  isYerbon: boolean;
}

export interface StaffMember {
  id: string;
  gameId: string;
  type: StaffType;
  name: string;
  level: number;
  salary: number;
  hiredAt: string;
  assignedGrowSpaceId: string | null;
}

export interface MarketPrice {
  strainId: string;
  strain?: Strain;
  currentPrice: number;
  basePrice: number;
  volatility: number;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface Transaction {
  id: string;
  gameId: string;
  type: 'buy' | 'sell' | 'upgrade' | 'salary' | 'event' | 'fine';
  amount: number;
  description: string;
  createdAt: string;
}

export interface GameEvent {
  id: string;
  gameId: string;
  type: EventType;
  message: string;
  severity: 'info' | 'warning' | 'danger' | 'success' | 'legendary';
  resolved: boolean;
  plantId: string | null;
  strainId: string | null;
  reward: number | null;
  penalty: number | null;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
}

export interface GameState {
  id: string;
  userId: string;
  money: number;
  level: number;
  experience: number;
  experienceToNext: number;
  reputation: number;
  totalHarvested: number;
  totalSold: number;
  growSpaces: GrowSpace[];
  activeGrowSpaceId: string;
  plants: Plant[];
  inventory: InventoryItem[];
  staff: StaffMember[];
  transactions: Transaction[];
  activeEvents: GameEvent[];
  achievements: Achievement[];
  unlockedDrugTypes: DrugType[];
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
