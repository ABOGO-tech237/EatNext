DO $$ BEGIN
  CREATE TYPE "RestaurantSource" AS ENUM ('USER_SUBMITTED', 'OSM_SYNC');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "source" "RestaurantSource" NOT NULL DEFAULT 'USER_SUBMITTED';
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "osm_id" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "osm_type" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "osm_tags" JSONB;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "last_synced_at" TIMESTAMP(3);
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "opening_hours" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "website" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "restaurants_osm_id_key" ON "restaurants"("osm_id");
CREATE INDEX IF NOT EXISTS "restaurants_source_idx" ON "restaurants"("source");
