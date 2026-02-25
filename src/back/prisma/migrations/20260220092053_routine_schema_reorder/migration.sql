-- AlterTable
ALTER TABLE "routines" ADD COLUMN     "client_id" INTEGER;

-- AddForeignKey
ALTER TABLE "routines" ADD CONSTRAINT "routines_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
