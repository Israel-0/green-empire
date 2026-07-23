import { Plant, Strain } from '../types/game';

function getSpeedMultiplier(lightsLevel: number, researcherLevel: number = 0, gardenerLevel: number = 0): number {
  const lightsBonus = 1 + (lightsLevel - 1) * 0.15;
  const researcherBonus = 1 + researcherLevel * 0.05;
  const gardenerBonus = gardenerLevel >= 2 ? 1 + (gardenerLevel - 1) * 0.1 : 1;
  return lightsBonus * researcherBonus * gardenerBonus;
}

export function calculateRemainingMinutes(plant: Plant, strain: Strain, lightsLevel: number = 1, researcherLevel: number = 0, gardenerLevel: number = 0): number {
  if (plant.stage === 'ready' || plant.harvestedAt) return 0;

  const plantedAt = new Date(plant.plantedAt).getTime();
  const now = Date.now();
  const elapsed = (now - plantedAt) / 60000;
  const speedMult = getSpeedMultiplier(lightsLevel, researcherLevel, gardenerLevel);
  const effectiveElapsed = elapsed * speedMult;
  const effectiveRemaining = strain.growTimeMinutes - effectiveElapsed;
  const realRemaining = effectiveRemaining / speedMult;

  return Math.max(0, realRemaining);
}

export function getStageProgress(plant: Plant, strain: Strain, lightsLevel: number = 1, researcherLevel: number = 0, gardenerLevel: number = 0): number {
  if (plant.stage === 'ready' || plant.harvestedAt) return 100;

  const plantedAt = new Date(plant.plantedAt).getTime();
  const now = Date.now();
  const elapsed = (now - plantedAt) / 60000;
  const speedMult = getSpeedMultiplier(lightsLevel, researcherLevel, gardenerLevel);
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
