-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "GameState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "money" REAL NOT NULL DEFAULT 50,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" REAL NOT NULL DEFAULT 0,
    "experienceToNext" REAL NOT NULL DEFAULT 100,
    "reputation" REAL NOT NULL DEFAULT 0,
    "totalHarvested" INTEGER NOT NULL DEFAULT 0,
    "totalSold" REAL NOT NULL DEFAULT 0,
    "activeGrowSpaceId" TEXT,
    "unlockedDrugTypes" TEXT NOT NULL DEFAULT '["marijuana"]',
    "seedInventory" TEXT NOT NULL DEFAULT '{}',
    "lastDealerSell" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GrowSpace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "capacity" INTEGER NOT NULL DEFAULT 2,
    "drugType" TEXT NOT NULL DEFAULT 'marijuana',
    "lights" INTEGER NOT NULL DEFAULT 1,
    "ventilation" INTEGER NOT NULL DEFAULT 1,
    "irrigation" INTEGER NOT NULL DEFAULT 1,
    "security" INTEGER NOT NULL DEFAULT 1,
    "unlocked" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "GrowSpace_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameState" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "growSpaceId" TEXT NOT NULL,
    "strainId" TEXT NOT NULL,
    "plantedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCaredAt" DATETIME,
    "stage" TEXT NOT NULL DEFAULT 'seed',
    "stageProgress" REAL NOT NULL DEFAULT 0,
    "waterLevel" REAL NOT NULL DEFAULT 100,
    "lightLevel" REAL NOT NULL DEFAULT 100,
    "nutrientLevel" REAL NOT NULL DEFAULT 100,
    "health" REAL NOT NULL DEFAULT 100,
    "quality" REAL NOT NULL DEFAULT 0,
    "isYerbon" BOOLEAN NOT NULL DEFAULT false,
    "isMoldy" BOOLEAN NOT NULL DEFAULT false,
    "hasPests" BOOLEAN NOT NULL DEFAULT false,
    "harvestedAt" DATETIME,
    "slot" INTEGER NOT NULL,
    "waterDecayRate" REAL NOT NULL DEFAULT 1.0,
    "lightDecayRate" REAL NOT NULL DEFAULT 1.0,
    "nutrientDecayRate" REAL NOT NULL DEFAULT 1.0,
    CONSTRAINT "Plant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameState" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Plant_growSpaceId_fkey" FOREIGN KEY ("growSpaceId") REFERENCES "GrowSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Plant_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "Strain" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Strain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "drugType" TEXT NOT NULL,
    "growTimeMinutes" INTEGER NOT NULL,
    "baseValue" REAL NOT NULL,
    "baseYield" REAL NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "unlockLevel" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "specialTrait" TEXT NOT NULL,
    "idealWater" REAL NOT NULL DEFAULT 70,
    "idealLight" REAL NOT NULL DEFAULT 80,
    "idealNutrients" REAL NOT NULL DEFAULT 70,
    "seedCost" REAL NOT NULL DEFAULT 10,
    "substrate" TEXT,
    "icon" TEXT NOT NULL DEFAULT '🌿',
    "color" TEXT NOT NULL DEFAULT '#4ade80'
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "strainId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "averageQuality" REAL NOT NULL DEFAULT 0,
    "tier" INTEGER NOT NULL DEFAULT 3,
    "isYerbon" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "InventoryItem_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameState" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "Strain" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StaffMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "salary" REAL NOT NULL DEFAULT 10,
    "hiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedGrowSpaceId" TEXT,
    CONSTRAINT "StaffMember_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameState" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StaffMember_assignedGrowSpaceId_fkey" FOREIGN KEY ("assignedGrowSpaceId") REFERENCES "GrowSpace" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarketPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "strainId" TEXT NOT NULL,
    "currentPrice" REAL NOT NULL DEFAULT 0,
    "basePrice" REAL NOT NULL DEFAULT 0,
    "volatility" REAL NOT NULL DEFAULT 0.1,
    "trend" TEXT NOT NULL DEFAULT 'stable',
    "changePercent" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MarketPrice_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "Strain" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Transaction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameState" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GameEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "plantId" TEXT,
    "strainId" TEXT,
    "reward" REAL,
    "penalty" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GameEvent_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameState" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL DEFAULT '🏆',
    "unlocked" BOOLEAN NOT NULL DEFAULT false,
    "unlockedAt" DATETIME,
    "progress" REAL NOT NULL DEFAULT 0,
    "maxProgress" REAL NOT NULL DEFAULT 1,
    CONSTRAINT "Achievement_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "GameState" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GameState_userId_key" ON "GameState"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Strain_name_key" ON "Strain"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MarketPrice_strainId_key" ON "MarketPrice"("strainId");
