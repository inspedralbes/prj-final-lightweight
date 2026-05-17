-- DropForeignKey
ALTER TABLE "session_progress" DROP CONSTRAINT "session_progress_user_id_fkey";

-- AlterTable
ALTER TABLE "exercise_catalog" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "session_progress" ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "session_progress" ADD CONSTRAINT "session_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
