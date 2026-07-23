import { Plant } from '@prisma/client';
import { PlantStage } from '../../../shared/types';

const STAGE_DURATIONS: Record<PlantStage, number> = {
  seed: 0.1,
  seedling: 0.15,
  vegetative: 0.3,
  flowering: 0.45,
  ready: 0,
};

const STAGE_ORDER: PlantStage[] = ['seed', 'seedling', 'vegetative', 'flowering', 'ready'];

interface EquipmentLevels {
  lights: number;
  ventilation: number;
  irrigation: number;
  security: number;
}

export interface QualityTier {
  tier: number;
  name: string;
  emoji: string;
  color: string;
  minQuality: number;
  multiplier: number;
}

export const QUALITY_TIERS: QualityTier[] = [
  { tier: 1, name: 'Mala',       emoji: '🥀', color: '#9ca3af', minQuality: 0,  multiplier: 0.5 },
  { tier: 2, name: 'Regular',    emoji: '🌿', color: '#e2e8f0', minQuality: 30, multiplier: 0.8 },
  { tier: 3, name: 'Normal',     emoji: '🍃', color: '#4ade80', minQuality: 50, multiplier: 1.0 },
  { tier: 4, name: 'Buena',      emoji: '🌱', color: '#38bdf8', minQuality: 65, multiplier: 1.3 },
  { tier: 5, name: 'Excelente',  emoji: '💎', color: '#a855f7', minQuality: 75, multiplier: 1.7 },
  { tier: 6, name: 'Premium',    emoji: '👑', color: '#fbbf24', minQuality: 85, multiplier: 2.5 },
  { tier: 7, name: 'Legendaria', emoji: '🌟', color: '#f472b6', minQuality: 93, multiplier: 4.0 },
  { tier: 8, name: 'Yerbon',     emoji: '✦', color: '#fbbf24', minQuality: 98, multiplier: 8.0 },
];

export function getQualityTier(quality: number): QualityTier {
  let result = QUALITY_TIERS[0];
  for (const tier of QUALITY_TIERS) {
    if (quality >= tier.minQuality) result = tier;
  }
  return result;
}

export function calculateQuality(
  progress: number,
  water: number,
  light: number,
  nutrients: number,
  health: number,
  researcherLevel: number,
  isYerbon: boolean,
  hasPests: boolean
): number {
  if (isYerbon) return 98 + Math.random() * 2;
  if (hasPests) return Math.max(0, Math.min(40, 20 + Math.random() * 20));

  const waterShortfall = Math.max(0, 100 - water) / 100;
  const lightShortfall = Math.max(0, 100 - light) / 100;
  const nutrientShortfall = Math.max(0, 100 - nutrients) / 100;
  const avgShortfall = (waterShortfall + lightShortfall + nutrientShortfall) / 3;

  const careScore = progress * 40 + (1 - avgShortfall) * 20;
  const LUCK_RANGE = [10, 15, 20, 25, 30, 35];
  const luckRange = LUCK_RANGE[Math.min(researcherLevel, 5)] || 10;
  const luckScore = Math.random() * luckRange;
  const healthScore = health * 0.15;
  const RESEARCHER_QUALITY = [0, 5, 10, 20, 35, 50];
  const researchBonus = RESEARCHER_QUALITY[Math.min(researcherLevel, 5)] || 0;

  return Math.min(100, Math.max(0, careScore + luckScore + healthScore + researchBonus));
}

export function calculatePlantGrowth(
  plant: Plant,
  strain: { growTimeMinutes: number },
  equipment: EquipmentLevels = { lights: 1, ventilation: 1, irrigation: 1, security: 1 },
  researcherLevel: number = 0,
  gardenerLevel: number = 0,
  now: Date = new Date()
) {
  const plantedAt = new Date(plant.plantedAt);
  const elapsedMs = now.getTime() - plantedAt.getTime();
  const elapsedMinutes = elapsedMs / 60000;
  const growTime = strain.growTimeMinutes;

  if (plant.harvestedAt) {
    return {
      stage: 'ready' as PlantStage,
      stageProgress: 100,
      waterLevel: plant.waterLevel,
      lightLevel: plant.lightLevel,
      nutrientLevel: plant.nutrientLevel,
      health: plant.health,
      quality: plant.quality,
    };
  }

  const LIGHTS_SPEED = [1.0, 1.10, 1.30, 1.60, 2.00];
  const lightsSpeedBonus = LIGHTS_SPEED[Math.min(equipment.lights, 5) - 1] || 1.0;
  const RESEARCHER_SPEED = [1.0, 1.05, 1.10, 1.15, 1.20, 1.25];
  const researcherSpeedBonus = RESEARCHER_SPEED[Math.min(researcherLevel, 5)] || 1.0;
  const GARDENER_SPEED = [1.0, 1.0, 1.1, 1.2, 1.35, 1.5];
  const gardenerSpeedBonus = GARDENER_SPEED[Math.min(gardenerLevel, 5)];
  const totalSpeedBonus = lightsSpeedBonus * researcherSpeedBonus * gardenerSpeedBonus;
  const effectiveElapsed = elapsedMinutes * totalSpeedBonus;
  const progress = Math.min(effectiveElapsed / growTime, 1.0);

  let stage: PlantStage = 'seed';
  if (progress >= 1.0) {
    stage = 'ready';
  } else {
    let cumulativeThreshold = 0;
    for (const s of STAGE_ORDER) {
      cumulativeThreshold += STAGE_DURATIONS[s];
      if (progress <= cumulativeThreshold) {
        stage = s;
        break;
      }
    }
  }

  const lastInteraction = plant.lastCaredAt ? new Date(plant.lastCaredAt) : new Date(plant.plantedAt);
  const timeSinceLastCare = now.getTime() - lastInteraction.getTime();
  const minutesSinceCare = timeSinceLastCare / 60000;

  const IRRIGATION_MULTIPLIERS = [1.0, 0.85, 0.70, 0.50, 0.25];
  const irrigationMultiplier = IRRIGATION_MULTIPLIERS[Math.min(equipment.irrigation, 5) - 1] || 1.0;

  const waterDecay = Math.min(plant.waterLevel, minutesSinceCare * plant.waterDecayRate * 20 * irrigationMultiplier);
  const lightDecay = Math.min(plant.lightLevel, minutesSinceCare * plant.lightDecayRate * 12 * irrigationMultiplier);
  const nutrientDecay = Math.min(plant.nutrientLevel, minutesSinceCare * plant.nutrientDecayRate * 14 * irrigationMultiplier);

  const newWater = Math.max(0, plant.waterLevel - waterDecay);
  const newLight = Math.max(0, plant.lightLevel - lightDecay);
  const newNutrients = Math.max(0, plant.nutrientLevel - nutrientDecay);

  const health = getHealthFromLevels(newWater, newLight, newNutrients, plant.health, equipment.ventilation);

  let quality = plant.quality;
  if (stage === 'ready' && plant.stage !== 'ready') {
    quality = calculateQuality(progress, newWater, newLight, newNutrients, health, researcherLevel, plant.isYerbon, plant.hasPests);
  } else if (stage === 'ready' && (quality === null || quality === undefined || quality === 0)) {
    quality = calculateQuality(progress, newWater, newLight, newNutrients, health, researcherLevel, plant.isYerbon, plant.hasPests);
  }

  let cumul = 0;
  let stageProgress = 0;
  for (const s of STAGE_ORDER) {
    cumul += STAGE_DURATIONS[s];
    if (stage === s) {
      const stageStart = cumul - STAGE_DURATIONS[s];
      const stageLength = STAGE_DURATIONS[s];
      stageProgress = stageLength > 0 ? Math.min(100, ((progress - stageStart) / stageLength) * 100) : 100;
      break;
    }
  }

  return {
    stage,
    stageProgress,
    waterLevel: newWater,
    lightLevel: newLight,
    nutrientLevel: newNutrients,
    health,
    quality,
  };
}

export function getHealthFromLevels(
  water: number,
  light: number,
  nutrients: number,
  currentHealth: number,
  ventilationLevel: number
): number {
  const waterShortfall = Math.max(0, 100 - water) / 100;
  const lightShortfall = Math.max(0, 100 - light) / 100;
  const nutrientShortfall = Math.max(0, 100 - nutrients) / 100;
  const maxShortfall = Math.max(waterShortfall, lightShortfall, nutrientShortfall);
  const VENTILATION_BONUS = [0, 0.10, 0.20, 0.35, 0.50];
  const ventilationBonus = VENTILATION_BONUS[Math.min(ventilationLevel, 5) - 1] || 0;
  const healthPenalty = maxShortfall * (1 - ventilationBonus) * 8;
  return Math.max(0, Math.min(100, currentHealth - healthPenalty));
}

export function shouldTriggerPest(health: number, ventilationLevel: number): boolean {
  const PEST_RESIST = [0, 0.15, 0.30, 0.50, 0.75];
  const ventReduction = PEST_RESIST[Math.min(ventilationLevel, 5) - 1] || 0;
  const baseChance = 0.1 * (1 - ventReduction);
  return health < 50 && Math.random() < baseChance;
}

export function shouldTriggerMold(waterLevel: number, health: number, ventilationLevel: number): boolean {
  const MOLD_RESIST = [0, 0.15, 0.30, 0.50, 0.75];
  const ventReduction = MOLD_RESIST[Math.min(ventilationLevel, 5) - 1] || 0;
  const baseChance = 0.08 * (1 - ventReduction);
  return waterLevel > 90 && health < 60 && Math.random() < baseChance;
}

export function shouldBeYerbon(quality: number, researcherLevel: number = 0): boolean {
  const baseChance = 0.02;
  const bonus = researcherLevel * 0.03;
  return quality > 85 && Math.random() < (baseChance + bonus);
}

export function getGrowthSpeedBonus(lightsLevel: number): number {
  const LIGHTS_PCT = [0, 10, 30, 60, 100];
  return LIGHTS_PCT[Math.min(lightsLevel, 5) - 1] || 0;
}

export function getDecayReduction(irrigationLevel: number): number {
  const DECAY_PCT = [0, 15, 30, 50, 75];
  return DECAY_PCT[Math.min(irrigationLevel, 5) - 1] || 0;
}

export function getPestResistance(ventilationLevel: number): number {
  const PEST_PCT = [0, 15, 30, 50, 75];
  return PEST_PCT[Math.min(ventilationLevel, 5) - 1] || 0;
}

export function getSecurityBonus(securityLevel: number): number {
  const SEC_PTS = [0, 5, 12, 25, 40];
  return SEC_PTS[Math.min(securityLevel, 5) - 1] || 0;
}
