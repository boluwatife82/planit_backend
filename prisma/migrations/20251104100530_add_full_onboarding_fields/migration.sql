/*
  Warnings:

  - You are about to drop the column `experience` on the `Planner` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Planner` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Planner` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `businessName` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `portfolio` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `priceRange` on the `Vendor` table. All the data in the column will be lost.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Planner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "companyName" TEXT,
    "businessAddress" TEXT,
    "cacNumber" TEXT,
    "bio" TEXT,
    "specialization" TEXT,
    "portfolio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Planner" ("bio", "createdAt", "id", "portfolio", "specialization", "updatedAt", "userId") SELECT "bio", "createdAt", "id", "portfolio", "specialization", "updatedAt", "userId" FROM "Planner";
DROP TABLE "Planner";
ALTER TABLE "new_Planner" RENAME TO "Planner";
CREATE UNIQUE INDEX "Planner_userId_key" ON "Planner"("userId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password", "updatedAt") SELECT "createdAt", "email", "id", "password", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "companyName" TEXT,
    "businessAddress" TEXT,
    "serviceCategory" TEXT,
    "yearsExperience" INTEGER,
    "cacNumber" TEXT,
    "bio" TEXT,
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
