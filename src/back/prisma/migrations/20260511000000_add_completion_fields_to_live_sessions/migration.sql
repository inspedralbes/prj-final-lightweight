-- Add completion fields to live_sessions table
ALTER TABLE "live_sessions" ADD COLUMN "completion_percentage" INTEGER;
ALTER TABLE "live_sessions" ADD COLUMN "completed_sets" INTEGER;
ALTER TABLE "live_sessions" ADD COLUMN "completed_exercises" INTEGER;