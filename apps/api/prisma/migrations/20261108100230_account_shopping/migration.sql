-- AlterEnum
ALTER TYPE "RestockFrequency" ADD VALUE 'EVERY_TWO_WEEKS';

-- AlterTable
ALTER TABLE "regular_products" ADD COLUMN     "quantity" INTEGER;
