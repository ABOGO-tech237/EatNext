-- Composite indexes for published restaurant listing, sorting, and stats.
CREATE INDEX "restaurants_status_avg_rating_idx" ON "restaurants"("status", "avg_rating");
CREATE INDEX "restaurants_status_name_idx" ON "restaurants"("status", "name");
CREATE INDEX "restaurants_status_city_idx" ON "restaurants"("status", "city");
