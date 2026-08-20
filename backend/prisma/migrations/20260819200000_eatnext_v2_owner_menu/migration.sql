-- Index pour GET /restaurants/mine et les revendications
CREATE INDEX IF NOT EXISTS "restaurants_owner_id_idx" ON "restaurants"("owner_id");

-- Catégorie de plat (console restaurateur v2)
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "category" TEXT;
