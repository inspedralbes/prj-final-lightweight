-- CreateTable
CREATE TABLE "client_profiles" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "goals" TEXT,
    "private_notes" TEXT,
    "personal_data_shared" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_client_id_key" ON "client_profiles"("client_id");

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
