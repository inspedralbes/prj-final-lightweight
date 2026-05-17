/*
  Warnings:

  - You are about to drop the `diet_meal_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `diet_meals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `diet_plans` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `food_catalog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "diet_meal_items" DROP CONSTRAINT "diet_meal_items_diet_meal_id_fkey";

-- DropForeignKey
ALTER TABLE "diet_meal_items" DROP CONSTRAINT "diet_meal_items_food_id_fkey";

-- DropForeignKey
ALTER TABLE "diet_meals" DROP CONSTRAINT "diet_meals_diet_plan_id_fkey";

-- DropForeignKey
ALTER TABLE "diet_plans" DROP CONSTRAINT "diet_plans_coach_id_fkey";

-- DropTable
DROP TABLE "diet_meal_items";

-- DropTable
DROP TABLE "diet_meals";

-- DropTable
DROP TABLE "diet_plans";

-- DropTable
DROP TABLE "food_catalog";
