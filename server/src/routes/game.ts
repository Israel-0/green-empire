import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { calculatePlantGrowth, getHealthFromLevels, getQualityTier } from '../services/plantGrowth';
import { processEvents } from '../services/eventEngine';
import { updateMarketPrices } from '../services/economy';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/state', async (req: AuthRequest, res: Response) => {
  try {
    let gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
      include: {
        growSpaces: true,
        plants: { include: { strain: true } },
        inventory: { include: { strain: true } },
        staff: true,
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        events: { orderBy: { createdAt: 'desc' } },
        achievements: true,
      },
    });

    if (!gameState) {
      let user = await prisma.user.findUnique({ where: { id: req.userId! } });
      if (!user) {
        return res.status(401).json({ success: false, error: 'User not found' });
      }
      gameState = await prisma.gameState.create({
        data: {
          userId: user.id,
          money: 50,
          level: 1,
          experience: 0,
          experienceToNext: 100,
          reputation: 0,
          growSpaces: {
            create: {
              name: 'Armario',
              level: 1,
              capacity: 2,
              drugType: 'marijuana',
              lights: 1,
              ventilation: 1,
              irrigation: 1,
              security: 1,
              unlocked: true,
            },
          },
        },
        include: {
          growSpaces: true,
          plants: { include: { strain: true } },
          inventory: { include: { strain: true } },
          staff: true,
          transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
          events: { orderBy: { createdAt: 'desc' } },
          achievements: true,
        },
      });
      if (gameState.growSpaces.length > 0) {
        await prisma.gameState.update({
          where: { id: gameState.id },
          data: { activeGrowSpaceId: gameState.growSpaces[0].id },
        });
        gameState.activeGrowSpaceId = gameState.growSpaces[0].id;
      }
    }

    const now = new Date();
    const hoursSinceLastActive = (now.getTime() - new Date(gameState.updatedAt).getTime()) / 3600000;
    const researcher = gameState.staff.find(s => s.type === 'researcher');
    const researcherLevel = researcher?.level || 0;

    for (const plant of gameState.plants) {
      if (plant.harvestedAt) continue;

      const growSpace = gameState.growSpaces.find(gs => gs.id === plant.growSpaceId);
      const equipment = growSpace
        ? { lights: growSpace.lights, ventilation: growSpace.ventilation, irrigation: growSpace.irrigation, security: growSpace.security }
        : { lights: 1, ventilation: 1, irrigation: 1, security: 1 };

      const assignedGrower = gameState.staff.find(
        (s) => s.type === 'grower' && s.assignedGrowSpaceId === plant.growSpaceId
      );
      const gardenerLevel = assignedGrower?.level || 0;

      const growth = calculatePlantGrowth(plant, plant.strain, equipment, researcherLevel, gardenerLevel, now);

      const updates: Record<string, unknown> = {
        waterLevel: growth.waterLevel,
        lightLevel: growth.lightLevel,
        nutrientLevel: growth.nutrientLevel,
        health: growth.health,
        stage: growth.stage,
        stageProgress: growth.stageProgress,
      };

      if (growth.stage === 'ready') {
        if (plant.stage !== 'ready' || !plant.quality || plant.quality === 0) {
          updates['quality'] = growth.quality;
        }
      }

      if (assignedGrower) {
        const waterBonus = [0, 33, 41, 49, 60, 75][Math.min(assignedGrower.level, 5)];
        const nutrientBonus = [0, 26, 32, 38, 45, 55][Math.min(assignedGrower.level, 5)];
        updates['waterLevel'] = Math.min(100, (updates['waterLevel'] as number) + waterBonus);
        updates['nutrientLevel'] = Math.min(100, (updates['nutrientLevel'] as number) + nutrientBonus);
      }

      const finalWater = updates['waterLevel'] as number;
      const finalLight = updates['lightLevel'] as number;
      const finalNutrient = updates['nutrientLevel'] as number;
      const rawHealth = getHealthFromLevels(finalWater, finalLight, finalNutrient, plant.health, equipment.ventilation);
      const HEALTH_FLOOR = [0, 70, 77, 85, 92, 100];
      updates['health'] = assignedGrower ? Math.max(rawHealth, HEALTH_FLOOR[Math.min(assignedGrower.level, 5)]) : rawHealth;

      if ((updates['health'] as number) <= 0) {
        await prisma.plant.update({
          where: { id: plant.id },
          data: { harvestedAt: new Date(), stage: 'ready', health: 0, quality: 0 },
        });
        await prisma.transaction.create({
          data: {
            gameId: gameState.id,
            type: 'event',
            amount: 0,
            description: `Planta muerta: ${plant.strain?.name || 'desconocida'} (salud 0)`,
          },
        });
        continue;
      }

      await prisma.plant.update({
        where: { id: plant.id },
        data: updates,
      });
    }

    gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
      include: {
        growSpaces: true,
        plants: { include: { strain: true } },
        inventory: { include: { strain: true } },
        staff: true,
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        events: { orderBy: { createdAt: 'desc' } },
        achievements: true,
      },
    });

    if (!gameState) {
      return res.status(404).json({ success: false, error: 'Game state not found' });
    }

    const growersLv3 = gameState.staff.filter(s => s.type === 'grower' && s.level >= 3);
    for (const grower of growersLv3) {
      const readyPlants = gameState.plants.filter(
        p => p.growSpaceId === grower.assignedGrowSpaceId && p.stage === 'ready' && !p.harvestedAt
      );
      for (const rp of readyPlants) {
        const isYerbon = rp.quality >= 98;
        const yield_ = Math.max(1, Math.round(rp.strain.baseYield * (rp.quality / 100) * (isYerbon ? 2 : 1)));
        const finalYield = grower.level >= 5 ? yield_ + 1 : yield_;
        const tier = getQualityTier(rp.quality).tier;

        await prisma.plant.update({
          where: { id: rp.id },
          data: { harvestedAt: new Date(), stage: 'ready' },
        });

        const existingInv = await prisma.inventoryItem.findFirst({
          where: { gameId: gameState.id, strainId: rp.strainId, tier },
        });
        if (existingInv) {
          const totalQty = existingInv.quantity + finalYield;
          const newAvg = ((existingInv.averageQuality * existingInv.quantity) + (rp.quality * finalYield)) / totalQty;
          await prisma.inventoryItem.update({
            where: { id: existingInv.id },
            data: { quantity: totalQty, averageQuality: Math.round(newAvg * 100) / 100 },
          });
        } else {
          await prisma.inventoryItem.create({
            data: { gameId: gameState.id, strainId: rp.strainId, quantity: finalYield, averageQuality: rp.quality, tier, isYerbon },
          });
        }

        await prisma.transaction.create({
          data: {
            gameId: gameState.id,
            type: 'event',
            amount: 0,
            description: `Auto-cosecha: ${rp.strain.name} (${rp.quality.toFixed(1)}% calidad)${isYerbon ? ' YERBON' : ''}`,
          },
        });

        await prisma.gameState.update({
          where: { id: gameState.id },
          data: {
            experience: gameState.experience + rp.strain.difficulty * 5,
            totalHarvested: (gameState.totalHarvested || 0) + 1,
          },
        });
      }
    }

    // Auto-plant for gardeners Lv3+
    const currentGameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
      include: { plants: { include: { strain: true } }, growSpaces: true, staff: true },
    });
    if (currentGameState?.autoPlantEnabled) {
      const autoPlanters = currentGameState.staff.filter(s => s.type === 'grower' && s.level >= 3);
      const seedInv: Record<string, number> = JSON.parse(currentGameState.seedInventory || '{}');

      for (const grower of autoPlanters) {
        const space = currentGameState.growSpaces.find(gs => gs.id === grower.assignedGrowSpaceId);
        if (!space) continue;

        const plantsInSpace = currentGameState.plants.filter(p => p.growSpaceId === space.id && !p.harvestedAt);
        const emptySlots = space.capacity - plantsInSpace.length;
        if (emptySlots <= 0) continue;

        const allStrains = await prisma.strain.findMany({
          where: { drugType: space.drugType },
          orderBy: { baseValue: 'desc' },
        });
        const availableStrains = allStrains.filter(s => (seedInv[s.id] || 0) > 0);

        if (availableStrains.length === 0) continue;

        const best = availableStrains[0];
        seedInv[best.id] = (seedInv[best.id] || 0) - 1;

        const slot = plantsInSpace.length + 1;
        const createdPlant = await prisma.plant.create({
          data: {
            gameId: currentGameState.id,
            growSpaceId: space.id,
            strainId: best.id,
            stage: 'seed',
            stageProgress: 0,
            waterLevel: 100,
            lightLevel: 100,
            nutrientLevel: 100,
            health: 100,
            quality: 0,
            slot,
            lastCaredAt: now,
          },
          include: { strain: true },
        });

        await prisma.transaction.create({
          data: {
            gameId: currentGameState.id,
            type: 'event',
            amount: 0,
            description: `Auto-plantado: ${createdPlant.strain.name} por ${grower.name}`,
          },
        });

        await prisma.gameState.update({
          where: { id: currentGameState.id },
          data: { seedInventory: JSON.stringify(seedInv) },
        });
      }
    }

    const dealer = gameState.staff.find(s => s.type === 'dealer');
    if (dealer) {
      const cooldownMinutes = [0, 30, 20, 15, 12, 10][dealer.level] || 30;
      const sellCount = [0, 1, 2, 3, 4, 5][dealer.level] || 1;
      const lastSell = gameState.lastDealerSell ? new Date(gameState.lastDealerSell) : null;
      const minutesSinceLastSell = lastSell ? (now.getTime() - lastSell.getTime()) / 60000 : cooldownMinutes;
      const canSell = !lastSell || minutesSinceLastSell >= cooldownMinutes;

      if (canSell) {
        const rounds = Math.floor(minutesSinceLastSell / cooldownMinutes);
        const totalRounds = Math.max(1, rounds);
        const totalSales = Math.min(sellCount * totalRounds, gameState.inventory.reduce((sum, i) => sum + i.quantity, 0));

        if (totalSales > 0) {
          let soldValue = 0;
          let remaining = totalSales;
          for (const item of gameState.inventory) {
            if (remaining <= 0) break;
            const toSell = Math.min(remaining, item.quantity);
            const marketPrice = await prisma.marketPrice.findUnique({ where: { strainId: item.strainId } });
            const itemBaseValue = marketPrice?.currentPrice || item.strain?.baseValue || 10;
            const price = itemBaseValue * (1 + (item.averageQuality - 50) / 100) * getQualityTier(item.averageQuality).multiplier * (1 + dealer.level * 0.1);
            soldValue += price * toSell;
            remaining -= toSell;

            const newQty = item.quantity - toSell;
            if (newQty <= 0) {
              await prisma.inventoryItem.delete({ where: { id: item.id } });
            } else {
              await prisma.inventoryItem.update({ where: { id: item.id }, data: { quantity: newQty } });
            }
          }

          await prisma.gameState.update({
            where: { id: gameState.id },
            data: {
              money: gameState.money + soldValue,
              totalSold: gameState.totalSold + soldValue,
              lastDealerSell: now,
            },
          });
          await prisma.transaction.create({
            data: {
              gameId: gameState.id,
              type: 'sell',
              amount: soldValue,
              description: `Venta auto: ${totalSales} items (${dealer.name})`,
            },
          });
        }
      }
    }

    await updateMarketPrices();
    await processEvents(gameState.id, hoursSinceLastActive);

    // Process staff salaries every 30 minutes
    const SALARY_INTERVAL_MINUTES = 30;
    const lastSalaryPaid = gameState.lastSalaryPaid ? new Date(gameState.lastSalaryPaid) : null;
    const minutesSinceSalary = lastSalaryPaid ? (now.getTime() - lastSalaryPaid.getTime()) / 60000 : SALARY_INTERVAL_MINUTES;

    if (minutesSinceSalary >= SALARY_INTERVAL_MINUTES && gameState.staff.length > 0) {
      const intervals = Math.floor(minutesSinceSalary / SALARY_INTERVAL_MINUTES);

      for (let i = 0; i < intervals; i++) {
        let currentState = await prisma.gameState.findUnique({ where: { userId: req.userId! }, include: { staff: true } });
        if (!currentState || currentState.staff.length === 0) break;

        const sortedStaff = [...currentState.staff].sort((a, b) => b.salary - a.salary);
        const totalSalary = sortedStaff.reduce((sum, s) => sum + s.salary, 0);

        if (currentState.money >= totalSalary) {
          await prisma.gameState.update({
            where: { id: currentState.id },
            data: {
              money: currentState.money - totalSalary,
              lastSalaryPaid: now,
            },
          });
          await prisma.transaction.create({
            data: {
              gameId: currentState.id,
              type: 'salary',
              amount: -totalSalary,
              description: `Salarios: ${sortedStaff.map(s => s.name).join(', ')}`,
            },
          });
        } else {
          let remainingMoney = currentState.money;
          let fired: string[] = [];
          let keepStaff = [...sortedStaff];

          for (const s of sortedStaff) {
            const newTotal = keepStaff.reduce((sum, x) => sum + x.salary, 0);
            if (remainingMoney >= newTotal) break;
            await prisma.staffMember.delete({ where: { id: s.id } });
            fired.push(s.name);
            keepStaff = keepStaff.filter(x => x.id !== s.id);
          }

          if (keepStaff.length > 0) {
            const newTotal = keepStaff.reduce((sum, x) => sum + x.salary, 0);
            await prisma.gameState.update({
              where: { id: currentState.id },
              data: { money: remainingMoney - newTotal, lastSalaryPaid: now },
            });
          } else {
            await prisma.gameState.update({
              where: { id: currentState.id },
              data: { lastSalaryPaid: now },
            });
          }

          if (fired.length > 0) {
            await prisma.transaction.create({
              data: {
                gameId: currentState.id,
                type: 'salary',
                amount: 0,
                description: `Despedidos por impago: ${fired.join(', ')}`,
              },
            });
          }
          if (keepStaff.length > 0) {
            await prisma.transaction.create({
              data: {
                gameId: currentState.id,
                type: 'salary',
                amount: -(keepStaff.reduce((sum, x) => sum + x.salary, 0)),
                description: `Salarios: ${keepStaff.map(s => s.name).join(', ')}`,
              },
            });
          }
        }
      }
    }

    gameState = await prisma.gameState.findUnique({
      where: { userId: req.userId! },
      include: {
        growSpaces: true,
        plants: { include: { strain: true } },
        inventory: { include: { strain: true } },
        staff: true,
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        events: { orderBy: { createdAt: 'desc' } },
        achievements: true,
      },
    });

    if (!gameState) {
      return res.status(404).json({ success: false, error: 'Game state not found' });
    }

    const parsed = {
      ...gameState,
      unlockedDrugTypes: JSON.parse(gameState.unlockedDrugTypes || '["marijuana"]'),
      seedInventory: JSON.parse(gameState.seedInventory || '{}'),
      lastDealerSell: gameState.lastDealerSell?.toISOString() || null,
      lastSalaryPaid: gameState.lastSalaryPaid?.toISOString() || null,
      autoPlantEnabled: gameState.autoPlantEnabled,
      activeEvents: gameState.events.filter(e => !e.resolved),
      events: undefined,
    };

    res.json({ success: true, data: parsed });
  } catch (error) {
    console.error('Get state error:', error);
    res.status(500).json({ success: false, error: 'Error al cargar el estado del juego' });
  }
});

router.get('/prices', async (_req: AuthRequest, res: Response) => {
  try {
    const prices = await prisma.marketPrice.findMany({
      include: { strain: true },
    });

    res.json({ success: true, data: prices });
  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({ success: false, error: 'Error al cargar precios' });
  }
});

router.post('/auto-plant/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const gameState = await prisma.gameState.findUnique({ where: { userId: req.userId! } });
    if (!gameState) return res.status(404).json({ success: false, error: 'Game not found' });

    const updated = await prisma.gameState.update({
      where: { id: gameState.id },
      data: { autoPlantEnabled: !gameState.autoPlantEnabled },
    });

    res.json({ success: true, data: { autoPlantEnabled: updated.autoPlantEnabled } });
  } catch (error) {
    console.error('Toggle auto-plant error:', error);
    res.status(500).json({ success: false, error: 'Error al cambiar auto-plant' });
  }
});

export default router;
