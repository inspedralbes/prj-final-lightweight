-- CreateEnum
CREATE TYPE "FriendInvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "session_progress" DROP CONSTRAINT "session_progress_user_id_fkey";

-- AlterTable
ALTER TABLE "session_progress" ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "FriendInvitation" (
    "id" SERIAL NOT NULL,
    "inviterId" INTEGER NOT NULL,
    "inviteeId" INTEGER NOT NULL,
    "status" "FriendInvitationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FriendInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FriendInvitation_inviteeId_status_idx" ON "FriendInvitation"("inviteeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FriendInvitation_inviterId_inviteeId_status_key" ON "FriendInvitation"("inviterId", "inviteeId", "status");

-- AddForeignKey
ALTER TABLE "session_progress" ADD CONSTRAINT "session_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FriendInvitation" ADD CONSTRAINT "FriendInvitation_inviteeId_fkey" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
