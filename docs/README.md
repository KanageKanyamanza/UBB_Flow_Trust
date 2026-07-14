# Documentation UBBFlow

## Présentation

UBBFlow est une application web de gestion financière et de conformité destinée aux organisations qui doivent suivre leurs flux de trésorerie, leurs documents, leurs scores de confiance et leurs obligations réglementaires.

Le projet est composé de :
- un frontend React + TypeScript + Vite
- un backend Express + TypeScript
- une base PostgreSQL avec Prisma
- un cache Redis
- un système d’upload de documents et de notifications push

## Objectifs du produit

- Centraliser les opérations financières d’une organisation
- Suivre les transactions, budgets et règles récurrentes
- Produire des indicateurs d’analyse et de prévision
- Gérer les documents et la conformité réglementaire
- Exposer un portail partenaire et un profil public vérifié
- Offrir une administration complète pour les opérateurs

## Structure du dépôt

- backend : API REST, logique métier, Prisma, services et middlewares
- frontend : interface utilisateur, pages, composants et routing
- config : configuration Nginx et reverse proxy
- docker-compose.yml : orchestration des services de développement et production

## Carte de la documentation

- [Architecture](./architecture.md)
- [Fonctionnalités](./features.md)
- [Développement](./development.md)
- [Déploiement](./deployment.md)

## Démarrage rapide

### Prérequis

- Node.js 20+
- pnpm ou npm
- Docker et Docker Compose (optionnel, recommandé pour la prod)
- PostgreSQL et Redis (si vous ne passez pas par Docker)

### Installation

```bash
npm install
npm run install:all
```

### Lancer l’application en développement

```bash
npm run dev
```

Cela démarre :
- le frontend Vite
- le backend Express avec rechargement automatique

### Variables d’environnement

Copiez le fichier d’exemple :

```bash
cp .env.example .env
```

Puis renseignez au minimum les secrets JWT, l’URL de base de données et les paramètres de stockage.

## Fonctionnalités principales

- Authentification et gestion des utilisateurs
- Comptes et transactions
- Budgets et règles récurrentes
- Analytique et prévisions
- Documents et conformité
- Portail partenaire et profil public
- Administration

## Liens utiles

- [Architecture](./architecture.md)
- [Fonctionnalités](./features.md)
- [Développement](./development.md)
- [Déploiement](./deployment.md)
