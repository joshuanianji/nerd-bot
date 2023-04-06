/*
  Warnings:

  - You are about to drop the column `position` on the `Reaction` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Reaction` table. All the data in the column will be lost.
  - Added the required column `deltaA` to the `Reaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deltaB` to the `Reaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Reaction" DROP COLUMN "position",
DROP COLUMN "weight",
ADD COLUMN     "deltaA" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "deltaB" DOUBLE PRECISION NOT NULL;
