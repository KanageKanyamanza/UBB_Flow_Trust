# Architecture du projet

## Vue d’ensemble

UBBFlow suit une architecture web moderne en 3 couches :
1. Frontend React pour l’interface utilisateur
2. Backend Express pour la logique métier et l’API
3. Base de données PostgreSQL avec Prisma pour la persistance

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, Tailwind CSS |
| Backend | Express, TypeScript, Prisma, Zod |
| Base de données | PostgreSQL |
| Cache | Redis |
| Authentification | JWT + refresh token |
| Stockage | stockage local, S3/MinIO possible |
| Déploiement | Docker Compose, Nginx, PM2 possible |

## Structure du dépôt

```text
backend/
  src/
    controllers/      # contrôleurs HTTP
    routes/           # définition des endpoints
    services/         # logique métier et services annexes
    middleware/       # sécurité, auth, upload
    config/           # configuration Prisma et environnement
  prisma/             # schéma Prisma, migrations, seed
frontend/
  src/
    application/      # contextes et cas d’usage
    domain/           # modèles et règles métier
    infrastructure/   # clients API, services externes
    presentation/     # pages, composants, hooks, routing
config/
  nginx.conf          # reverse proxy
```

## Flux de fonctionnement

### 1. Frontend

Le frontend est un client SPA avec routing défini dans [frontend/src/App.tsx](../frontend/src/App.tsx). Il expose des pages pour :
- authentification
- tableau de bord
- comptes et transactions
- budgets et règles récurrentes
- documents et conformité
- administration

### 2. Backend

Le backend démarre dans [backend/src/index.ts](../backend/src/index.ts). Il enregistre :
- les routes principales
- les middlewares de sécurité
- les rate limiters
- les services cron et push

### 3. Données

Le schéma Prisma définit les entités principales :
- Organization
- User
- Account
- Transaction
- Budget
- RecurringRule
- Document
- Checklist
- TrustScore
- PublicProfile
- ConsentGrant
- Alert

## Sécurité

Le backend applique :
- CORS restreint
- Helmet
- validation du content type
- sanitization des requêtes
- rate limiting sur l’authentification
- JWT et refresh tokens
- protection contre les uploads malveillants via middleware dédié

## Stockage et médias

Le projet supporte :
- stockage local dans le dossier uploads
- stockage S3/MinIO via variables d’environnement
- téléchargement de fichiers associés aux transactions, documents et preuves

## Notifications et jobs

- services de push web
- cron jobs pour la logique périodique
- file de scoring et traitement asynchrone de certaines tâches

## Déploiement

Le déploiement peut se faire via :
- Docker Compose avec PostgreSQL, Redis, backend, frontend et Nginx
- PM2 pour un environnement Node.js dédié

Le fichier [docker-compose.yml](../docker-compose.yml) décrit l’orchestration recommandée en production.
