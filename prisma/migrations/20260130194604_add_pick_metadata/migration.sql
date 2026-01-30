-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PickHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "pickedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL DEFAULT 'pure',
    "avoidCount" INTEGER,
    "candidateAppIds" JSONB,
    CONSTRAINT "PickHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PickHistory_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "AuctionPool" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PickHistory_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_PickHistory" ("gameId", "id", "pickedAt", "poolId", "userId") SELECT "gameId", "id", "pickedAt", "poolId", "userId" FROM "PickHistory";
DROP TABLE "PickHistory";
ALTER TABLE "new_PickHistory" RENAME TO "PickHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
