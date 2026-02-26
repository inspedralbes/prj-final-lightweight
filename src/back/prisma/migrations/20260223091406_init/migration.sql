/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `exercise_catalog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "exercise_catalog_name_key" ON "exercise_catalog"("name");
