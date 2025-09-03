# ✍️ Authentication Microservice

## 🎯 **Vue d'Ensemble**

Ce microservice gère l'écosystème d'utilisateurs de Nexus avec **1 entités principales** :
- **✍️ Authentification** - Création, suivi et gestion des utilisateurs de la plateforme

---

## ⚙️ **Configuration & Variables d'Environnement**

### 🔧 Fichier de Configuration

Copiez le fichier de configuration exemple et adaptez-le :

```bash
cp .env.example .env
```

### 📝 Variables Disponibles

| Variable | Description | Valeur Exemple | Obligatoire |
|----------|-------------|----------------|-------------|
| `PORT` | Port d'écoute du service | `3001` | ❌ |
| `NODE_ENV` | Environnement d'exécution | `development` | ✅ |
| `SUPABASE_URL` | URL de votre instance Supabase | `https://xxx.supabase.co` | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service Supabase (admin) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ |
| `FRONTEND_URL` | URL du frontend pour CORS | `http://localhost:3000` | ✅ |
| `JWT_SECRET` | Token JWT pour authentification login | `jwtsecrethere` | ✅ |

### 🔐 **Configuration Supabase**

```bash
# Supabase Configuration
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre_service_role_key_ici
```

> ⚠️ **Important** : Utilisez la **Service Role Key** pour les opérations backend, pas la clé publique !

### 🌐 **Configuration CORS**

```bash
# Frontend URL pour CORS
FRONTEND_URL=http://localhost:3000
```

---

## 🚀 **Démarrage Rapide**

### 📦 Installation

```bash
# Installation des dépendances
npm install

# Configuration de l'environnement
cp .env.example .env
# ✏️ Éditez le fichier .env avec vos valeurs

# Démarrage du service
npm start
```

### 🌐 Accès au Service

- **Service** : http://localhost:3001
- **Documentation API** : http://localhost:3001/api-docs 📖

---

## 📋 **API Endpoints**

### 👤 **Routes Utilisateurs**

| Méthode | Endpoint | Description | Codes Retour |
|---------|----------|-------------|--------------|
| 🔍 `GET` | `/users` | Récupérer tous les utilisateurs | `200` |
| 🔍 `GET` | `/users/:id` | Récupérer un utilisateurs avec un id précis | `200`, `404` |
| ➕ `POST` | `/users` | Create a new user (sign up) | `201`, `400`, `409` |
| ✏️ `PATCH` | `/users/:id` | Modifier les détails d'un utilisateur | `200`, `400`, `404` |
| ❌ `DELETE` | `/users/:id` | Supprimer un utilisateur | `200`, `404` |
| 📎 `POST` | `/login` | Login utilisateur et récupérer un JWT token | `201`, `400`, `404` |
| 📎 `POST` | `/logout` | Logout utilisateur en invalidant le token | `200`, `404` |

---

## 📖 **Documentation Interactive**

### 🌐 **Swagger UI**

Explorez l'API de manière interactive :

**[📋 Documentation Swagger Complète](http://localhost:3001/api-docs)**

---

## 🧪 **Tests**

### ▶️ Exécution des Tests

```bash
# Tests complets
npm test

# Tests spécifiques
npm test __tests__/projectAuth.tests.js

# Tests avec coverage
npm run test:coverage
```

---

## 🚀 **Production & Déploiement**

### 🔧 **Variables Production**

```bash
NODE_ENV=production
PORT=3003
SUPABASE_URL=https://prod-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=prod_service_key
FRONTEND_URL=https://votre-domaine.com
```

### 🐳 **Docker**

Le service est inclus dans le `docker-compose.yml` principal du projet Nexus.

### 📁 **Volumes & Stockage**
```yaml
volumes:
  - ./uploads:/app/uploads  # Persistance des fichiers PDF
```

---

**✍️ Auth Service** - *Part of Nexus Ecosystem*  

🔗 **[Retour au projet principal](https://github.com/T-YEP-Nexus/frontend)**

