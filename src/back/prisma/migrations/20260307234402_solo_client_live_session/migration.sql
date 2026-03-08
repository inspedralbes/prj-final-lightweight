-- DropForeignKey
ALTER TABLE "live_sessions" DROP CONSTRAINT "live_sessions_coach_id_fkey";

-- AlterTable
ALTER TABLE "live_sessions" ALTER COLUMN "coach_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
