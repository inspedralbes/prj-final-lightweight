-- AlterTable: add email field, add invitationCode, remove default from role
ALTER TABLE "users" ADD COLUMN "email" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN "invitationCode" TEXT;
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

-- Remove the temporary default used for the migration
ALTER TABLE "users" ALTER COLUMN "email" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "users_invitationCode_key" ON "users"("invitationCode");
