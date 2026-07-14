# Guide de déploiement

## Déploiement recommandé : Docker Compose

Le projet est prêt pour un déploiement avec Docker Compose.

### Étapes

1. Copier les variables d’environnement :

```bash
cp .env.example .env
```

2. Renseigner les secrets et les URLs de service.

3. Démarrer les services :

```bash
docker compose up --build -d
```

4. Appliquer les migrations Prisma :

```bash
docker compose exec backend npx prisma migrate deploy
```

5. Vérifier l’état :

```bash
docker compose ps
docker compose logs backend --tail=50
```

## Services inclus

- PostgreSQL
- Redis
- Backend Express
- Frontend Nginx
- Nginx reverse proxy

## Déploiement sans Docker

Une alternative consiste à utiliser PM2 avec Node.js et une instance PostgreSQL/Redis externe.

### Étapes

```bash
cd backend
npm ci
npm run build
```

Puis configurer les variables d’environnement et lancer :

```bash
pm2 start ecosystem.config.js --env production
```

## Sécurité production

- utiliser des mots de passe forts
- générer des secrets JWT longs et aléatoires
- configurer HTTPS avec un certificat validé
- limiter l’accès aux ports sensibles
- surveiller les logs et les métriques

## Vérifications post-déploiement

Vérifier les points suivants :
- la route /health retourne un état OK
- le frontend se charge correctement
- les uploads fonctionnent
- les migrations Prisma sont appliquées
- les notifications push sont configurées si utilisées

## Mise à jour

```bash
git pull
docker compose up --build -d
docker compose exec backend npx prisma migrate deploy
```
