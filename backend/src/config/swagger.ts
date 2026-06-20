/**
 * Configuration Swagger / OpenAPI de l'API EatNext.
 *
 * Ce module construit la spécification OpenAPI 3.0 à partir de deux sources :
 *  1. La `definition` ci-dessous (métadonnées, serveurs, schémas réutilisables,
 *     schéma de sécurité JWT, énumérations métier…).
 *  2. Les commentaires JSDoc `@openapi` présents dans les fichiers de routes,
 *     scannés dynamiquement par `swagger-jsdoc`.
 *
 * La spec générée est ensuite exposée :
 *  - sous forme d'interface interactive Swagger UI (montée dans `app.ts`) ;
 *  - en JSON brut sur `/v1/docs.json` pour les outils externes (Postman, codegen…).
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJSDoc from 'swagger-jsdoc';

// Résout le dossier courant aussi bien en dev (exécution TS via tsx) qu'en
// production (exécution du JS compilé dans `dist/`). On en déduit l'extension
// des fichiers de routes à scanner afin que les annotations JSDoc soient lues
// dans les deux environnements.
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const isCompiled = currentFile.endsWith('.js');
const routesGlob = path.join(currentDir, '..', 'routes', isCompiled ? '*.js' : '*.ts');

/**
 * Définition statique de la spécification OpenAPI.
 * Les `components.schemas` factorisent les entités et enveloppes de réponse
 * afin d'être référencés via `$ref` dans les annotations de routes.
 */
const definition: swaggerJSDoc.Options['definition'] = {
  openapi: '3.0.3',
  info: {
    title: 'EatNext API',
    version: '1.0.0',
    description:
      "API REST d'EatNext : découverte de restaurants, avis, plaintes, favoris et administration. " +
      "Toutes les réponses suivent une enveloppe standard `{ success, data, meta }` en cas de succès " +
      "et `{ success: false, error: { code, message, status } }` en cas d'erreur.",
  },
  // Deux serveurs sont exposés car l'API est montée à la fois sur /v1 et /api/v1.
  servers: [
    { url: 'http://localhost:3000/v1', description: 'Local (préfixe /v1)' },
    { url: 'http://localhost:3000/api/v1', description: 'Local (préfixe /api/v1)' },
  ],
  tags: [
    { name: 'Auth', description: 'Inscription, connexion et gestion de session' },
    { name: 'Restaurants', description: 'Recherche et gestion des restaurants' },
    { name: 'Reviews', description: 'Avis et notes des restaurants' },
    { name: 'Complaints', description: 'Signalements et plaintes (machine à états)' },
    { name: 'Favorites', description: 'Favoris et listes de favoris' },
    { name: 'Admin', description: 'Endpoints réservés aux administrateurs' },
  ],
  components: {
    // Authentification par jeton JWT (Bearer). À appliquer via `security` sur
    // les opérations protégées.
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: "Jeton d'accès JWT obtenu via /auth/login ou /auth/register.",
      },
    },
    schemas: {
      // ---- Énumérations métier (alignées sur prisma/schema.prisma) ----
      UserRole: {
        type: 'string',
        enum: ['user', 'owner', 'admin'],
        description: 'Rôle de l\'utilisateur.',
      },
      RestaurantStatus: {
        type: 'string',
        enum: ['pending', 'published', 'rejected', 'suspended'],
        description: 'Cycle de vie d\'un restaurant (modération).',
      },
      ComplaintType: {
        type: 'string',
        enum: ['poor_service', 'hygiene', 'wrong_info', 'fraud', 'closed_business'],
      },
      ComplaintStatus: {
        type: 'string',
        enum: ['pending', 'under_review', 'resolved', 'rejected'],
        description:
          'États d\'une plainte. Transitions autorisées : pending → under_review|rejected, under_review → resolved|rejected.',
      },
      PriceRange: {
        type: 'integer',
        minimum: 1,
        maximum: 4,
        description: 'Gamme de prix de 1 (€) à 4 (€€€€).',
      },

      // ---- Entités ----
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          fullName: { type: 'string' },
          role: { $ref: '#/components/schemas/UserRole' },
          isVerified: { type: 'boolean' },
          isBanned: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Restaurant: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          ownerId: { type: 'string', format: 'uuid', nullable: true },
          name: { type: 'string' },
          description: { type: 'string', nullable: true },
          address: { type: 'string' },
          city: { type: 'string' },
          lat: { type: 'number', format: 'float' },
          lng: { type: 'number', format: 'float' },
          cuisineType: { type: 'string' },
          priceRange: { $ref: '#/components/schemas/PriceRange' },
          avgRating: { type: 'number', format: 'float' },
          reviewCount: { type: 'integer' },
          photos: { type: 'array', items: { type: 'string' } },
          status: { $ref: '#/components/schemas/RestaurantStatus' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Review: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          restaurantId: { type: 'string', format: 'uuid' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          content: { type: 'string', nullable: true },
          photos: { type: 'array', items: { type: 'string' } },
          ownerReply: { type: 'string', nullable: true },
          isFlagged: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Complaint: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          restaurantId: { type: 'string', format: 'uuid' },
          type: { $ref: '#/components/schemas/ComplaintType' },
          description: { type: 'string' },
          status: { $ref: '#/components/schemas/ComplaintStatus' },
          adminNote: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Favorite: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          restaurantId: { type: 'string', format: 'uuid' },
          listId: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      FavoriteList: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },

      // ---- Jetons d'authentification ----
      AuthTokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
          expiresIn: { type: 'integer', example: 3600 },
        },
      },

      // ---- Enveloppes de réponse standard ----
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 137 },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { description: 'Charge utile spécifique à l\'endpoint.' },
          meta: { $ref: '#/components/schemas/Pagination' },
        },
        required: ['success', 'data'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_ERROR' },
              message: { type: 'string', example: 'Données invalides.' },
              status: { type: 'integer', example: 400 },
            },
          },
        },
        required: ['success', 'error'],
      },
    },
    // Réponses d'erreur réutilisables pour limiter la répétition dans les routes.
    responses: {
      Unauthorized: {
        description: 'Jeton manquant, invalide ou expiré.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      Forbidden: {
        description: 'Droits insuffisants pour cette action.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      NotFound: {
        description: 'Ressource introuvable.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
      ValidationError: {
        description: 'Corps ou paramètres de requête invalides.',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
      },
    },
  },
};

/**
 * Options finales passées à `swagger-jsdoc`. Le tableau `apis` indique les
 * fichiers à scanner pour y extraire les annotations `@openapi`.
 */
const options: swaggerJSDoc.Options = {
  definition,
  apis: [routesGlob],
};

/** Spécification OpenAPI complète, prête à être servie par Swagger UI. */
export const swaggerSpec = swaggerJSDoc(options) as Record<string, unknown>;
