import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

export async function updateMarketPrices() {
  const prices = await prisma.marketPrice.findMany({ include: { strain: true } });
  if (prices.length === 0) return;

  const now = new Date();
  const lastUpdate = new Date(prices[0].updatedAt);
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / 60000;

  if (minutesSinceUpdate < 10) return;

  for (const price of prices) {
    const intervalMinutes = 10;
    const bucket = Math.floor(now.getTime() / (intervalMinutes * 60000));
    const seed = hashString(price.strainId + bucket.toString());
    const rng = pseudoRandom(seed);

    const factor = 1 + (rng - 0.5) * price.volatility * 0.8;
    const newPrice = Math.max(
      price.basePrice * 0.3,
      Math.min(price.basePrice * 2.0, price.basePrice * factor)
    );

    const changePercent = ((newPrice - price.basePrice) / price.basePrice) * 100;

    let trend: string = 'stable';
    if (changePercent > 5) trend = 'up';
    else if (changePercent < -5) trend = 'down';

    await prisma.marketPrice.update({
      where: { id: price.id },
      data: {
        currentPrice: Math.round(newPrice * 100) / 100,
        trend,
        changePercent: Math.round(changePercent * 100) / 100,
      },
    });
  }
}

export async function initializeMarketPrices() {
  const strains = await prisma.strain.findMany();
  const existingPrices = await prisma.marketPrice.findMany();

  for (const strain of strains) {
    const exists = existingPrices.find(p => p.strainId === strain.id);
    if (!exists) {
      const volatility = strain.difficulty / 10;
      await prisma.marketPrice.create({
        data: {
          strainId: strain.id,
          currentPrice: strain.baseValue,
          basePrice: strain.baseValue,
          volatility,
          trend: 'stable',
          changePercent: 0,
        },
      });
    }
  }
}
