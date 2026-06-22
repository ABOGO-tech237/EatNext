/**
 * Routes des restaurants (`/v1/restaurants`).
 *
 * Mélange d'endpoints publics (recherche, détail, à proximité) et d'endpoints
 * protégés (création/édition par le propriétaire ou un admin, suppression
 * réservée à l'admin). La validation des entrées repose sur Zod.
 */
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { sendSuccess } from '../utils/response.js';
import * as restaurantService from '../services/restaurant.service.js';
import * as osmSyncService from '../services/osmSync.service.js';
import * as overpassService from '../services/overpass.service.js';

const router = Router();

// Filtres de recherche : `coerce` convertit les query strings en nombres.
const searchSchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radius: z.coerce.number().optional(),
  cuisine: z.string().optional(),
  minRating: z.coerce.number().optional(),
  priceRange: z.coerce.number().min(1).max(4).optional(),
  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),
  sortBy: z.enum(['rating', 'distance', 'name']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  address: z.string().min(3),
  city: z.string().min(2),
  lat: z.number(),
  lng: z.number(),
  cuisineType: z.string().min(2),
  priceRange: z.number().min(1).max(4),
  photos: z.array(z.string()).optional(),
});

/**
 * @openapi
 * /restaurants:
 *   get:
 *     tags: [Restaurants]
 *     summary: Rechercher des restaurants publiés
 *     description: Liste paginée avec filtres plein-texte, géographiques et tri. Résultats mis en cache (Redis).
 *     parameters:
 *       - { in: query, name: q, schema: { type: string }, description: "Recherche plein-texte nom cuisine" }
 *       - { in: query, name: city, schema: { type: string } }
 *       - { in: query, name: lat, schema: { type: number } }
 *       - { in: query, name: lng, schema: { type: number } }
 *       - { in: query, name: radius, schema: { type: number }, description: Rayon en mètres (nécessite lat/lng) }
 *       - { in: query, name: cuisine, schema: { type: string } }
 *       - { in: query, name: minRating, schema: { type: number } }
 *       - { in: query, name: priceRange, schema: { $ref: '#/components/schemas/PriceRange' } }
 *       - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
 *       - { in: query, name: limit, schema: { type: integer, minimum: 1, maximum: 50, default: 20 } }
 *       - { in: query, name: sortBy, schema: { type: string, enum: [rating, distance, name] } }
 *       - { in: query, name: order, schema: { type: string, enum: [asc, desc] } }
 *     responses:
 *       200:
 *         description: Liste paginée de restaurants.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Restaurant' } }
 *                     meta: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/', validateQuery(searchSchema), async (req, res, next) => {
  try {
    const result = await restaurantService.searchRestaurants(req.query as never);
    // La pagination est renvoyée dans `meta` conformément à l'enveloppe standard.
    sendSuccess(res, result.items, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/nearby:
 *   get:
 *     tags: [Restaurants]
 *     summary: Restaurants à proximité d'un point
 *     parameters:
 *       - { in: query, name: lat, required: true, schema: { type: number } }
 *       - { in: query, name: lng, required: true, schema: { type: number } }
 *       - { in: query, name: radius, schema: { type: number, default: 5000 }, description: Rayon en mètres }
 *       - { in: query, name: limit, schema: { type: integer, default: 20 } }
 *       - { in: query, name: includeOsm, schema: { type: boolean, default: false }, description: Fusionner avec les POIs OpenStreetMap }
 *     responses:
 *       200:
 *         description: Restaurants triés par distance croissante.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Restaurant' } }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get('/nearby', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius ?? 5000);
    const limit = Number(req.query.limit ?? 20);
    const includeOsm = req.query.includeOsm === 'true' || req.query.includeOsm === '1';
    // lat/lng sont obligatoires pour une recherche géographique.
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'lat et lng requis', status: 400 } });
    }
    const result = includeOsm
      ? await restaurantService.getMergedNearbyRestaurants(lat, lng, radius, limit, true)
      : await restaurantService.getNearbyRestaurants(lat, lng, radius, limit);
    sendSuccess(res, result.items, 200, includeOsm ? { osmCount: (result as { osmCount?: number }).osmCount, dbCount: (result as { dbCount?: number }).dbCount } : undefined);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/osm/nearby:
 *   get:
 *     tags: [Restaurants]
 *     summary: POIs alimentaires OpenStreetMap à proximité (Overpass API)
 *     description: >
 *       Recherche dynamique via Overpass. Si sync=true, upsert en PostgreSQL avant retour
 *       (cache persistant + id UUID pour avis/favoris).
 *     parameters:
 *       - { in: query, name: lat, required: true, schema: { type: number }, example: 3.8667 }
 *       - { in: query, name: lng, required: true, schema: { type: number }, example: 11.5167 }
 *       - { in: query, name: radius, schema: { type: number, default: 2000 }, description: Rayon en mètres }
 *       - { in: query, name: limit, schema: { type: integer, default: 50 } }
 *       - { in: query, name: sync, schema: { type: boolean, default: false }, description: Synchroniser en base avant retour }
 *     responses:
 *       200:
 *         description: Liste de POIs OSM (dynamiques ou persistés si sync=true).
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { type: array, items: { $ref: '#/components/schemas/Restaurant' } }
 *       503: { description: Overpass API indisponible ou timeout }
 */
router.get('/osm/nearby', async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius ?? 2000);
    const limit = Number(req.query.limit ?? 50);
    const sync = req.query.sync === 'true' || req.query.sync === '1';

    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'lat et lng requis', status: 400 } });
    }

    const result = await restaurantService.getOsmNearbyRestaurants(lat, lng, radius, limit, sync);
    sendSuccess(res, result.items, 200, { source: result.source });
  } catch (err) {
    next(err);
  }
});

const osmSyncSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radius: z.number().min(100).max(50000).optional(),
  limit: z.number().min(1).max(200).optional(),
});

/**
 * @openapi
 * /restaurants/osm/sync:
 *   post:
 *     tags: [Restaurants]
 *     summary: Synchroniser une zone OSM vers PostgreSQL
 *     description: Fetch Overpass puis upsert des restaurants OSM (osmId unique). Public pour alimenter le cache local.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [lat, lng]
 *             properties:
 *               lat: { type: number, example: 3.8667 }
 *               lng: { type: number, example: 11.5167 }
 *               radius: { type: number, default: 2000, description: Rayon en mètres }
 *               limit: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Zone synchronisée.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         synced: { type: integer }
 *                         items: { type: array, items: { $ref: '#/components/schemas/Restaurant' } }
 */
router.post('/osm/sync', validateBody(osmSyncSchema), async (req, res, next) => {
  try {
    const { lat, lng, radius = 2000, limit = 50 } = req.body;
    const result = await osmSyncService.syncNearbyToDb(lat, lng, radius, limit);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/osm/{osmType}/{osmId}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Détail d'un POI OSM par identifiant
 *     parameters:
 *       - { in: path, name: osmType, required: true, schema: { type: string, enum: [node, way, relation] } }
 *       - { in: path, name: osmId, required: true, schema: { type: string } }
 *       - { in: query, name: sync, schema: { type: boolean, default: false }, description: Upsert en base avant retour }
 *     responses:
 *       200:
 *         description: POI OSM trouvé.
 *       404:
 *         description: POI introuvable sur OpenStreetMap.
 */
router.get('/osm/:osmType/:osmId', async (req, res, next) => {
  try {
    const osmType = req.params.osmType as 'node' | 'way' | 'relation';
    const osmId = req.params.osmId;
    const sync = req.query.sync === 'true' || req.query.sync === '1';

    if (!['node', 'way', 'relation'].includes(osmType)) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'osmType invalide', status: 400 } });
    }

    if (sync) {
      const restaurant = await osmSyncService.syncByOsmId(osmType, osmId);
      if (!restaurant) {
        return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'POI OSM introuvable', status: 404 } });
      }
      return sendSuccess(res, restaurant);
    }

    const dto = await overpassService.getByOsmId(osmType, osmId);
    if (!dto) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'POI OSM introuvable', status: 404 } });
    }
    sendSuccess(res, {
      id: `osm-${dto.osmType}-${dto.osmId}`,
      ...dto,
      priceRange: 2,
      avgRating: 0,
      reviewCount: 0,
      photos: [],
      status: 'published',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/{id}:
 *   get:
 *     tags: [Restaurants]
 *     summary: Détail d'un restaurant
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Restaurant trouvé (avec propriétaire et compteurs).
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Restaurant' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id', async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants:
 *   post:
 *     tags: [Restaurants]
 *     summary: Créer un restaurant (en attente de modération)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address, city, lat, lng, cuisineType, priceRange]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               lat: { type: number }
 *               lng: { type: number }
 *               cuisineType: { type: string }
 *               priceRange: { $ref: '#/components/schemas/PriceRange' }
 *               photos: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Restaurant créé avec le statut `pending`.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Restaurant' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/', authenticate, validateBody(createSchema), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.createRestaurant(req.user!.sub, req.body);
    sendSuccess(res, restaurant, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/{id}:
 *   put:
 *     tags: [Restaurants]
 *     summary: Mettre à jour un restaurant (remplacement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               lat: { type: number }
 *               lng: { type: number }
 *               cuisineType: { type: string }
 *               priceRange: { $ref: '#/components/schemas/PriceRange' }
 *               photos: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Restaurant mis à jour.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Restaurant' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id', authenticate, validateBody(createSchema.partial()), async (req, res, next) => {
  try {
    // Le service vérifie que l'appelant est propriétaire OU admin.
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id,
      req.user!.sub,
      req.user!.role,
      req.body,
    );
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/{id}:
 *   patch:
 *     tags: [Restaurants]
 *     summary: Mise à jour partielle d'un restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               priceRange: { $ref: '#/components/schemas/PriceRange' }
 *     responses:
 *       200:
 *         description: Restaurant mis à jour.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Restaurant' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id', authenticate, validateBody(createSchema.partial()), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id,
      req.user!.sub,
      req.user!.role,
      req.body,
    );
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/{id}:
 *   delete:
 *     tags: [Restaurants]
 *     summary: Supprimer un restaurant (admin uniquement)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Restaurant supprimé.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete('/:id', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    await restaurantService.deleteRestaurant(req.params.id);
    sendSuccess(res, { deleted: true });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/{id}/claim:
 *   post:
 *     tags: [Restaurants]
 *     summary: Revendiquer la propriété d'un restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Demande de revendication enregistrée.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Restaurant' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/:id/claim', authenticate, async (req, res, next) => {
  try {
    // Repasse le restaurant en `pending` afin qu'un admin valide la revendication.
    const restaurant = await restaurantService.updateRestaurant(
      req.params.id,
      req.user!.sub,
      req.user!.role,
      { status: 'pending' },
    );
    await restaurantService.updateRestaurant(req.params.id, 'admin', 'admin', {});
    sendSuccess(res, restaurant);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/{id}/photos:
 *   post:
 *     tags: [Restaurants]
 *     summary: Ajouter des photos à un restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [photos]
 *             properties:
 *               photos: { type: array, items: { type: string, format: uri } }
 *     responses:
 *       201:
 *         description: Photos ajoutées.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data: { $ref: '#/components/schemas/Restaurant' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post('/:id/photos', authenticate, validateBody(z.object({ photos: z.array(z.string()) })), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    // Seuls le propriétaire du restaurant ou un admin peuvent ajouter des photos.
    if (req.user!.role !== 'admin' && restaurant.ownerId !== req.user!.sub) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé', status: 403 } });
    }
    const updated = await restaurantService.updateRestaurant(
      req.params.id,
      req.user!.sub,
      req.user!.role,
      { photos: req.body.photos },
    );
    sendSuccess(res, updated, 201);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/{id}/menu:
 *   get:
 *     tags: [Restaurants]
 *     summary: Récupérer le menu d'un restaurant
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     responses:
 *       200:
 *         description: Menu du restaurant.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id/menu', async (req, res, next) => {
  try {
    // Le menu n'est pas encore modélisé en base : on renvoie le restaurant et un tableau vide.
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    sendSuccess(res, { restaurantId: restaurant.id, items: [] });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /restaurants/{id}/menu:
 *   put:
 *     tags: [Restaurants]
 *     summary: Remplacer le menu d'un restaurant
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string, format: uuid } }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name: { type: string }
 *                     price: { type: number }
 *     responses:
 *       200:
 *         description: Menu mis à jour.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/SuccessResponse' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put('/:id/menu', authenticate, validateBody(z.object({ items: z.array(z.object({ name: z.string(), price: z.number() })).optional() })), async (req, res, next) => {
  try {
    const restaurant = await restaurantService.getRestaurantById(req.params.id);
    if (req.user!.role !== 'admin' && restaurant.ownerId !== req.user!.sub) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Accès refusé', status: 403 } });
    }
    // Le menu n'étant pas persisté en base pour le moment, on renvoie l'écho de l'entrée.
    sendSuccess(res, { restaurantId: restaurant.id, items: req.body.items ?? [] });
  } catch (err) {
    next(err);
  }
});

export default router;
