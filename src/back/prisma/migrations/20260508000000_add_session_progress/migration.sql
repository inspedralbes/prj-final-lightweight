-- CreateSessionProgressTable
CREATE TABLE "session_progress" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "completed_exercises" INTEGER NOT NULL DEFAULT 0,
    "completed_sets" INTEGER NOT NULL DEFAULT 0,
    "completion_percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP,
    "is_partial" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "session_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "session_progress_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "live_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "session_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- AddUniqueConstraint
CREATE UNIQUE INDEX "session_progress_session_id_user_id_key" ON "session_progress"("session_id", "user_id");