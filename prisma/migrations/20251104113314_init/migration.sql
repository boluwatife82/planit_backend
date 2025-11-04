/*
  Warnings:

  - You are about to drop the column `businessAddress` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `cacNumber` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `companyName` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `serviceCategory` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `yearsExperience` on the `Vendor` table. All the data in the column will be lost.
  - Added the required column `businessName` to the `Vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `Vendor` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "businessName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "bio" TEXT,
    "location" TEXT,
    "phone" TEXT,
    "experience" INTEGER,
    "priceRange" TEXT,
    "portfolio" TEXT,
    "licenseUrl" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vendor" ("bio", "createdAt", "id", "licenseUrl", "updatedAt", "userId", "verified") SELECT "bio", "createdAt", "id", "licenseUrl", "updatedAt", "userId", "verified" FROM "Vendor";
DROP TABLE "Vendor";
ALTER TABLE "new_Vendor" RENAME TO "Vendor";
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
