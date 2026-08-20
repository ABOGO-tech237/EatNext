CREATE INDEX IF NOT EXISTS "restaurants_status_avg_rating_idx" ON "restaurants"("status", "avg_rating");
CREATE INDEX IF NOT EXISTS "restaurants_status_name_idx" ON "restaurants"("status", "name");
CREATE INDEX IF NOT EXISTS "restaurants_status_city_idx" ON "restaurants"("status", "city");
