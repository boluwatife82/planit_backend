/*
  Warnings:

  - You are about to drop the column `bio` on the `Planner` table. All the data in the column will be lost.
  - You are about to drop the column `portfolio` on the `Planner` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `Planner` table. All the data in the column will be lost.
  - You are about to drop the column `bio` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `businessName` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `portfolio` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `priceRange` on the `Vendor` table. All the data in the column will be lost.
  - You are about to drop the column `verified` on the `Vendor` table. All the data in the column will be lost.
  - Made the column `businessAddress` on table `Planner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `companyName` on table `Planner` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `User` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `businessAddress` to the `Vendor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `companyName` to the `Vendor` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Planner" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "cacNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Planner" ("businessAddress", "cacNumber", "companyName", "createdAt", "id", "updatedAt", "userId") SELECT "businessAddress", "cacNumber", "companyName", "createdAt", "id", "updatedAt", "userId" FROM "Planner";
DROP TABLE "Planner";
ALTER TABLE "new_Planner" RENAME TO "Planner";
CREATE UNIQUE INDEX "Planner_userId_key" ON "Planner"("userId");
CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "gender" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "firstName", "gender", "id", "lastName", "password", "phone", "role", "updatedAt") SELECT "createdAt", "email", "firstName", "gender", "id", "lastName", "password", "phone", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE TABLE "new_Vendor" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessAddress" TEXT NOT NULL,
    "cacNumber" TEXT,
    "serviceCategories" TEXT,
    "yearsOfExperience" INTEGER,
    "phone" TEXT,
    "licenseUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vendor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Vendor" ("createdAt", "id", "licenseUrl", "phone", "updatedAt", "userId") SELECT "createdAt", "id", "licenseUrl", "phone", "updatedAt", "userId" FROM "Vendor";
DROP TABLE "Vendor";
ALTER TABLE "new_Vendor" RENAME TO "Vendor";
CREATE UNIQUE INDEX "Vendor_userId_key" ON "Vendor"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
