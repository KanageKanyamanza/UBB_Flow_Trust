# Guide de Déploiement UBBFlow

## Prérequis

- Linux VPS (Ubuntu 22.04+ recommandé)
- Docker + Docker Compose v2
- Git

---

## Méthode 1 : Docker Compose (Recommandée)

### 1. Cloner le dépôt

```bash
git clone https://github.com/youruser/ubbflow.git /var/www/ubbflow
cd /var/www/ubbflow
```

### 2. Configurer les variables d'environnement

```bash
cp .env.example .env
nano .env
```

> Renseigner tous les champs, notamment :
> - `POSTGRES_PASSWORD` — mot de passe fort
> - `JWT_SECRET` et `JWT_REFRESH_SECRET` — générer avec :
>   ```bash
>   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
>   ```

### 3. Build et démarrage

```bash
docker compose up --build -d
```

### 4. Appliquer les migrations Prisma

```bash
docker compose exec backend npx prisma migrate deploy
```

### 5. Vérifier l'état des services

```bash
docker compose ps
docker compose logs backend --tail=50
curl http://localhost/health
```

### Structure des ports exposés

| Service | Port interne | Port public |
|---|---|---|
| Nginx (reverse proxy) | — | **80**, 443 |
| Backend (Express) | 5000 | via Nginx |
| Frontend (Nginx) | 80 | via Nginx |
| PostgreSQL | 5432 | non exposé |
| Redis | 6379 | non exposé |

### URLs de test

```bash
# Health check backend
curl http://localhost/health

# Frontend
curl http://localhost/

# API auth
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

---

## Méthode 2 : PM2 (sans Docker)

> Prérequis : Node.js 20+, PostgreSQL et Redis installés localement.

### 1. Build backend

```bash
cd backend
npm ci
npm run build
```

### 2. Configurer .env

```bash
cp .env.example .env
# Renseigner DATABASE_URL, REDIS_URL, JWT_SECRET etc.
```

### 3. Migrations

```bash
npx prisma migrate deploy
```

### 4. Démarrer avec PM2

```bash
# Installer PM2 globalement si pas encore fait
npm install -g pm2

# Démarrer en mode cluster
pm2 start ecosystem.config.js --env production

# Sauvegarder pour redémarrage automatique
pm2 save
pm2 startup
```

### Commandes PM2 utiles

```bash
pm2 status                    # État des processus
pm2 logs ubbflow-backend      # Logs en temps réel
pm2 reload ubbflow-backend    # Redémarrage sans downtime
pm2 stop ubbflow-backend      # Arrêt
pm2 monit                     # Dashboard terminal
```

---

## Mise à Jour en Production

```bash
# Avec Docker Compose
git pull
docker compose up --build -d
docker compose exec backend npx prisma migrate deploy

# Avec PM2
git pull
cd backend && npm run build
pm2 reload ecosystem.config.js --env production
npx prisma migrate deploy
```

---

## HTTPS avec Let's Encrypt

```bash
# Installer Certbot
apt install certbot python3-certbot-nginx -y

# Obtenir un certificat
certbot --nginx -d yourdomain.com

# Décommenter le bloc HTTPS dans config/nginx.conf
# Relancer Nginx
docker compose restart nginx
```

---

## Vérification Post-Déploiement

- [ ] `curl http://yourdomain.com/health` retourne `{"status":"OK"}`
- [ ] `curl http://yourdomain.com/` charge le frontend React
- [ ] Headers sécurité visibles : `curl -I http://yourdomain.com/`
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Rate limit auth : 6ème appel `/auth/login` → 429
- [ ] Service Worker visible dans DevTools > Application > Service Workers
