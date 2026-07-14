# Guide de développement

## Prérequis

- Node.js 20+
- npm ou pnpm
- PostgreSQL
- Redis
- Docker (optionnel)

## Installation des dépendances

À la racine du projet :

```bash
npm install
npm run install:all
```

## Configuration de l’environnement

Copiez le fichier d’exemple :

```bash
cp .env.example .env
```

Variables importantes à définir :
- POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_DB
- DATABASE_URL
- JWT_SECRET / JWT_REFRESH_SECRET
- REDIS_URL
- STORAGE_TYPE
- ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD

## Démarrage en mode développement

```bash
npm run dev
```

Cela exécute :
- frontend via Vite
- backend via tsx watch

## Génération Prisma

```bash
cd backend
npx prisma generate
```

## Migrations

```bash
cd backend
npx prisma migrate dev
```

## Seed initial

```bash
cd backend
npm run seed:admin
```

## Tests

```bash
cd backend
npm test
```

## Lint et formatage

```bash
npm run lint
npm run format
```

## Bonnes pratiques

- garder les contrôleurs fins et déléguer la logique métier aux services
- valider les entrées avec Zod lorsque possible
- utiliser Prisma pour toutes les opérations de base de données
- protéger les routes sensibles avec les middlewares dédiés
- tester les changements sur un environnement local avant déploiement

## Structure de travail recommandée

- modifier le schéma Prisma si le modèle de données change
- exécuter les migrations
- mettre à jour les routes et les contrôleurs si nécessaire
- vérifier l’intégration dans le frontend
