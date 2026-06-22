-- CreateEnum
CREATE TYPE "RestaurantSource" AS ENUM ('USER_SUBMITTED', 'OSM_SYNC');

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "source" "RestaurantSource" NOT NULL DEFAULT 'USER_SUBMITTED',
ADD COLUMN     "osm_id" TEXT,
ADD COLUMN     "osm_type" TEXT,
ADD COLUMN     "osm_tags" JSONB,
ADD COLUMN     "last_synced_at" TIMESTAMP(3),
ADD COLUMN     "opening_hours" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_osm_id_key" ON "restaurants"("osm_id");

-- CreateIndex
CREATE INDEX "restaurants_source_idx" ON "restaurants"("source");
