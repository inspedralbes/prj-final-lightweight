-- AlterTable
ALTER TABLE "exercise_catalog" ADD COLUMN     "equipment" TEXT,
ADD COLUMN     "forceType" TEXT,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "mechanic" TEXT,
ADD COLUMN     "primaryMuscle" TEXT[],
ADD COLUMN     "secondaryMuscle" TEXT[];
