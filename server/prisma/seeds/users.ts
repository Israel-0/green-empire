import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping test users in production');
    return;
  }

  const users = [
    { username: 'player', email: 'player@greenempire.local', password: 'player1' },
    { username: 'admin', email: 'admin@greenempire.local', password: 'test123' },
  ];

  for (const { username, email, password } of users) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      console.log(`User ${username} already exists, skipping`);
      continue;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        gameState: {
          create: {
            money: username === 'admin' ? 999999 : 200,
            level: username === 'admin' ? 100 : 1,
            experience: username === 'admin' ? 50000 : 0,
            experienceToNext: username === 'admin' ? 200000 : 100,
            reputation: username === 'admin' ? 1000 : 0,
            growSpaces: {
              create: {
                name: 'Armario',
                level: username === 'admin' ? 5 : 1,
                capacity: username === 'admin' ? 10 : 2,
                drugType: 'marijuana',
                lights: username === 'admin' ? 5 : 1,
                ventilation: username === 'admin' ? 5 : 1,
                irrigation: username === 'admin' ? 5 : 1,
                security: username === 'admin' ? 5 : 1,
                unlocked: true,
              },
            },
          },
        },
      },
      include: {
        gameState: {
          include: { growSpaces: true },
        },
      },
    });

    const gameState = user.gameState;
    if (gameState && gameState.growSpaces.length > 0) {
      await prisma.gameState.update({
        where: { id: gameState.id },
        data: { activeGrowSpaceId: gameState.growSpaces[0].id },
      });
    }

    console.log(`Created user: ${username} (${username === 'admin' ? 'admin' : 'player'})`);
  }

  console.log('User seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
