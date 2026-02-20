-- DropForeignKey
ALTER TABLE "live_sessions" DROP CONSTRAINT "live_sessions_routine_id_fkey";

-- AddForeignKey
ALTER TABLE "live_sessions" ADD CONSTRAINT "live_sessions_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;
