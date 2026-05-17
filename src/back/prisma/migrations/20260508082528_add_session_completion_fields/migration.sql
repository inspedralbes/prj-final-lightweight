-- AlterTable
ALTER TABLE "live_sessions" ADD COLUMN     "completed_exercises" INTEGER,
ADD COLUMN     "completed_sets" INTEGER,
ADD COLUMN     "completion_percentage" INTEGER;
