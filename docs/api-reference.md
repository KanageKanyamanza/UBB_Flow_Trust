# Référence API rapide

## Base URL

Par défaut :
- backend local : http://localhost:5000
- via reverse proxy : http://localhost

## Endpoints principaux

### Authentification

- POST /auth/register
- POST /auth/login
- POST /auth/refresh
- POST /auth/logout

### Comptes

- GET /accounts
- POST /accounts
- PUT /accounts/:id
- DELETE /accounts/:id

### Transactions

- GET /transactions
- POST /transactions
- PUT /transactions/:id
- DELETE /transactions/:id

### Budgets

- GET /budgets
- POST /budgets
- PUT /budgets/:id
- DELETE /budgets/:id

### Règles récurrentes

- GET /recurring-rules
- POST /recurring-rules
- PUT /recurring-rules/:id
- DELETE /recurring-rules/:id

### Analytique

- GET /analytics/overview
- GET /analytics/trends
- GET /analytics/forecast

### Documents et conformité

- GET /documents
- POST /documents
- GET /compliance
- POST /compliance/check

### Profil public et partenaire

- GET /public/:slug
- POST /partner/portal
- GET /consent-grants

### Uploads

- POST /upload
- GET /uploads/:file

### Push notifications

- POST /push/subscribe
- POST /push/send

### Administration

- POST /api/admin/auth/login
- GET /api/admin/organizations
- GET /api/admin/users
- GET /api/admin/analytics
- GET /api/admin/audit-logs

## Health check

- GET /health

## Notes

La liste exacte des routes peut évoluer selon les contrôleurs présents dans le backend. Consultez les fichiers du dossier backend/src/routes pour la version exacte disponible dans votre branche.
