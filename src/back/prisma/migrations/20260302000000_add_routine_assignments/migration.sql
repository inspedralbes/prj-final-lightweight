-- CreateTable: routine_assignments (many-to-many between routines and clients)
CREATE TABLE "routine_assignments" (
    "id" SERIAL NOT NULL,
    "routine_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routine_assignments_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: a client can only be assigned to a routine once
CREATE UNIQUE INDEX "routine_assignments_routine_id_client_id_key" ON "routine_assignments"("routine_id", "client_id");

-- AddForeignKey
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_routine_id_fkey" FOREIGN KEY ("routine_id") REFERENCES "routines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "routine_assignments" ADD CONSTRAINT "routine_assignments_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing clientId assignments to the new join table
INSERT INTO "routine_assignments" ("routine_id", "client_id")
SELECT "id", "client_id"
FROM "routines"
WHERE "client_id" IS NOT NULL;

-- DropColumn: remove old single clientId from routines
ALTER TABLE "routines" DROP COLUMN "client_id";
