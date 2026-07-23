-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GameState" (
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
    "lastSalaryPaid" DATETIME,
    "autoPlantEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GameState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_GameState" ("activeGrowSpaceId", "createdAt", "experience", "experienceToNext", "id", "lastDealerSell", "lastSalaryPaid", "level", "money", "reputation", "seedInventory", "totalHarvested", "totalSold", "unlockedDrugTypes", "updatedAt", "userId") SELECT "activeGrowSpaceId", "createdAt", "experience", "experienceToNext", "id", "lastDealerSell", "lastSalaryPaid", "level", "money", "reputation", "seedInventory", "totalHarvested", "totalSold", "unlockedDrugTypes", "updatedAt", "userId" FROM "GameState";
DROP TABLE "GameState";
ALTER TABLE "new_GameState" RENAME TO "GameState";
CREATE UNIQUE INDEX "GameState_userId_key" ON "GameState"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
