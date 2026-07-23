import { PrismaClient } from '@prisma/client';
import { EventType } from '../../../shared/types';

const prisma = new PrismaClient();

export async function processEvents(gameId: string, hoursSinceUpdate: number = 0) {
  const gameState = await prisma.gameState.findUnique({
    where: { id: gameId },
    include: {
      plants: { include: { strain: true } },
      growSpaces: true,
      staff: true,
      events: true,
    },
  });

  if (!gameState) return [];

  const newEvents: Array<{
    type: EventType;
    message: string;
    severity: 'info' | 'warning' | 'danger' | 'success' | 'legendary';
    plantId?: string;
    strainId?: string;
    reward?: number;
    penalty?: number;
  }> = [];

  const now = new Date();

  const securityLevel = gameState.growSpaces.reduce((max, gs) => Math.max(max, gs.security), 1);
  const ventilationLevel = gameState.growSpaces.reduce((max, gs) => Math.max(max, gs.ventilation), 1);

  const PEST_RESIST = [0, 0.15, 0.30, 0.50, 0.75];
  const SECURITY_REDUCTION = [0, 5, 12, 25, 40];

  const pestResist = PEST_RESIST[Math.min(ventilationLevel, 5) - 1] || 0;
  const securityReduction = SECURITY_REDUCTION[Math.min(securityLevel, 5) - 1] || 0;

  for (const plant of gameState.plants) {
    if (plant.harvestedAt) continue;
    if (plant.hasPests) continue;

    const health = plant.health;

    if (health >= 70) continue;

    const pestChance = health < 20 ? 0.70 : health < 40 ? 0.45 : health < 55 ? 0.20 : 0.08;

    const alreadyHasPestEvent = gameState.events.some(e => e.type === 'pest' && e.plantId === plant.id && !e.resolved);

    if (!alreadyHasPestEvent && Math.random() < pestChance * (1 - pestResist)) {
      await prisma.plant.update({
        where: { id: plant.id },
        data: { hasPests: true },
      });
      newEvents.push({
        type: 'pest',
        message: `Plaga en ${plant.strain.name}! Compra pesticida para eliminarla (cuesta $15).`,
        severity: 'warning',
        plantId: plant.id,
      });
    }
  }

  const operationSize = gameState.plants.filter(p => !p.harvestedAt).length;
  const riskLevel = Math.max(0, operationSize * 3 - securityReduction);
  const securityStaff = gameState.staff.find(s => s.type === 'security');
  const staffLevel = securityStaff?.level || 0;
  const refundRate = staffLevel >= 3 ? 0.5 : staffLevel >= 2 ? 0.25 : 0;

  if (Math.random() * 100 < riskLevel * hoursSinceUpdate * 0.5) {
    const fine = gameState.money * (0.1 + Math.random() * 0.3);
    const actualFine = refundRate > 0 ? fine * (1 - refundRate) : fine;

    newEvents.push({
      type: 'raid',
      message: refundRate > 0
        ? `Redada! Perdiste $${actualFine.toFixed(0)} (tu seguridad recupero el ${Math.round(refundRate * 100)}%)`
        : `La policia ha hecho una redada!`,
      severity: 'danger',
      penalty: actualFine,
    });
  }

  const createdEvents = [];
  for (const eventData of newEvents) {
    const event = await prisma.gameEvent.create({
      data: {
        gameId,
        ...eventData,
      },
    });
    createdEvents.push(event);
  }

  return createdEvents;
}
