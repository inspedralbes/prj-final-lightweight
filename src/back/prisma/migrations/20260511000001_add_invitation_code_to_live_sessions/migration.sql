-- Add invitation_code column to live_sessions table
ALTER TABLE "live_sessions" ADD COLUMN "invitation_code" TEXT;
CREATE UNIQUE INDEX "live_sessions_invitation_code_key" ON "live_sessions"("invitation_code");