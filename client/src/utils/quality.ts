import { Plant, Strain } from '../types/game';

const LIGHTS_SPEED = [1.0, 1.10, 1.30, 1.60, 2.00];
const RESEARCHER_SPEED = [1.0, 1.05, 1.10, 1.15, 1.20, 1.25];
const GARDENER_SPEED = [1.0, 1.0, 1.1, 1.2, 1.35, 1.5];

function getSpeedMultiplier(lightsLevel: number, researcherLevel: number = 0, gardenerLevel: number = 0, playerLevel: number = 1): number {
  const lightsBonus = LIGHTS_SPEED[Math.min(lightsLevel, 5) - 1] || 1.0;
  const researcherBonus = RESEARCHER_SPEED[Math.min(researcherLevel, 5)] || 1.0;
  const gardenerBonus = GARDENER_SPEED[Math.min(gardenerLevel, 5)] || 1.0;
  const levelBonus = 1 + playerLevel * 0.01;
  return lightsBonus * researcherBonus * gardenerBonus * levelBonus;
}

export function calculateRemainingMinutes(plant: Plant, strain: Strain, lightsLevel: number = 1, researcherLevel: number = 0, gardenerLevel: number = 0, playerLevel: number = 1): number {
  if (plant.stage === 'ready' || plant.harvestedAt) return 0;

  const plantedAt = new Date(plant.plantedAt).getTime();
  const now = Date.now();
  const elapsed = (now - plantedAt) / 60000;
  const speedMult = getSpeedMultiplier(lightsLevel, researcherLevel, gardenerLevel, playerLevel);
  const effectiveElapsed = elapsed * speedMult;
  const effectiveRemaining = strain.growTimeMinutes - effectiveElapsed;
  const realRemaining = effectiveRemaining / speedMult;

  return Math.max(0, realRemaining);
}

export function getStageProgress(plant: Plant, strain: Strain, lightsLevel: number = 1, researcherLevel: number = 0, gardenerLevel: number = 0, playerLevel: number = 1): number {
  if (plant.stage === 'ready' || plant.harvestedAt) return 100;

  const plantedAt = new Date(plant.plantedAt).getTime();
  const now = Date.now();
  const elapsed = (now - plantedAt) / 60000;
  const speedMult = getSpeedMultiplier(lightsLevel, researcherLevel, gardenerLevel, playerLevel);
  const progress = Math.min(100, (elapsed * speedMult / strain.growTimeMinutes) * 100);

  return progress;
}

export function getStageFromProgress(progress: number): string {
  if (progress >= 100) return 'ready';
  if (progress >= 55) return 'flowering';
  if (progress >= 25) return 'vegetative';
  if (progress >= 10) return 'seedling';
  return 'seed';
}

export function getStageIcon(stage: string): string {
  switch (stage) {
    case 'seed': return '🌰';
    case 'seedling': return '🌱';
    case 'vegetative': return '🌿';
    case 'flowering': return '🌳';
    case 'ready': return '⭐';
    default: return '🌿';
  }
}

export { getSpeedMultiplier };
