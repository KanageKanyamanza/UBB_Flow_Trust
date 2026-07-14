# Fonctionnalités du projet

## 1. Authentification et accès

Le système gère :
- inscription et connexion
- génération de jetsons JWT
- refresh tokens
- rôles utilisateurs et administration
- blocage de comptes si nécessaire

## 2. Gestion des organisations

L’application est pensée autour d’une organisation propriétaire des données. Chaque organisation contient :
- utilisateurs
- comptes
- transactions
- budgets
- documents
- scores de confiance
- alertes

## 3. Comptes et transactions

Les utilisateurs peuvent :
- créer et suivre des comptes financiers
- enregistrer des transactions de débit/crédit
- catégoriser les opérations
- associer des pièces justificatives
- consulter l’historique

## 4. Budgets et règles récurrentes

Le module de budget permet :
- définir des budgets par catégorie ou par période
- suivre l’écart entre prévisions et dépenses
- créer des règles récurrentes pour les paiements périodiques
- automatiser la gestion de flux réguliers

## 5. Analyse et prévisions

Le produit inclut :
- des vues d’analyse sur les opérations
- la génération de snapshots de prévision
- des scores de readiness / confiance
- une logique de monitoring des risques

## 6. Documents et conformité

UBBFlow couvre la gestion documentaire avec :
- upload de documents
- versions de documents
- checklists de conformité
- statuts de documents (draft, approved, etc.)
- intégration de la logique de conformité et de vérification

## 7. Profil public et portail partenaire

Le système propose :
- un profil public vérifié avec slug dédié
- un portail partenaire pour les échanges externes
- la gestion des consentements et autorisations

## 8. Alertes et notifications

Les utilisateurs peuvent recevoir :
- alertes liées à des événements métier
- notifications push via Web Push
- suivi des événements critiques ou de sécurité

## 9. Administration

Le backend expose une zone d’administration complète avec des routes dédiées pour :
- gérer les organisations
- gérer les utilisateurs
- gérer les documents
- consulter les audits
- superviser les scores de confiance et la conformité
- surveiller la santé système

## 10. Expérience utilisateur

Le frontend propose :
- une landing page moderne
- un tableau de bord central
- une navigation claire entre modules
- une interface responsive
- une version anglaise/française via i18n
