-- AddColumn: target_client_id to invitations (stores which specific client was invited)
ALTER TABLE "invitations" ADD COLUMN "target_client_id" INTEGER;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_target_client_id_fkey" FOREIGN KEY ("target_client_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
