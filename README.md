# 🍽️ Resto API — API de Réservation de Restaurant

API REST complète pour la gestion d'un restaurant fictif, développée avec **Node.js**, **Express** et **MySQL**.

## 📋 Description

Resto API est une application backend permettant de gérer :
- L'**authentification** des utilisateurs (clients et admins)
- Les **réservations** avec attribution automatique des tables
- Le **menu** du restaurant (consultable sans compte)
- Les **tables** et leur disponibilité par créneau horaire
- Les **créneaux d'ouverture** personnalisés

---

## 🛠️ Stack technique

- **Runtime :** Node.js
- **Framework :** Express.js
- **Base de données :** MySQL
- **Authentification :** JWT (jsonwebtoken) + bcrypt
- **Validation :** express-validator
- **Variables d'environnement :** dotenv

---

## 📁 Structure du projet

```
resto-api/
├── server.js                # Point d'entrée
├── .env                     # Variables d'environnement
├── .env.example             # Template des variables
├── package.json
├── database/
│   └── init.sql             # Script de création des tables + seed
├── config/
│   └── db.js                # Connexion MySQL
├── middlewares/
│   ├── authMiddleware.js    # Vérification JWT
│   └── isAdmin.js           # Vérification rôle admin
├── routes/
│   ├── authRoutes.js
│   ├── reservationRoutes.js
│   ├── menuRoutes.js
│   └── tableRoutes.js
├── controllers/
│   ├── authController.js
│   ├── reservationController.js
│   ├── menuController.js
│   └── tableController.js
└── models/
    ├── userModel.js
    ├── reservationModel.js
    ├── menuModel.js
    └── tableModel.js
```

---

## ⚙️ Installation

### Prérequis

- Node.js (v18+)
- MySQL (v8+)
- npm

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/votre-groupe/resto-api.git
cd resto-api

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Éditer le fichier .env avec vos paramètres

# 4. Créer la base de données
mysql -u root -p < database/init.sql

# 5. Lancer le serveur
npm start

# Ou en mode développement (avec nodemon)
npm run dev
```

### Variables d'environnement (.env)

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=resto_api
JWT_SECRET=votre_secret_jwt
JWT_EXPIRES_IN=24h
```

---

## 🔐 Comptes de test

| Rôle   | Email              | Mot de passe |
|--------|--------------------|--------------|
| Admin  | admin@resto.com    | Admin123!    |
| Client | marie@example.com  | Client123!   |
| Client | jean@example.com   | Client123!   |

---

## 📡 Routes de l'API

### 1. Authentification

| Méthode | Route     | Auth | Description                 |
|---------|-----------|------|-----------------------------|
| POST    | `/signup` | ❌   | Créer un compte utilisateur |
| POST    | `/login`  | ❌   | Connexion + retour JWT      |

**POST /signup** — Créer un compte

```json
// Request body
{
  "email": "jean@example.com",
  "password": "Client123!",
  "fname": "Jean",
  "lname": "Dupont",
  "phone": "0612345678"
}

// Response 201
{
  "message": "Compte créé avec succès",
  "user": {
    "id": 3,
    "email": "jean@example.com",
    "fname": "Jean",
    "lname": "Dupont",
    "role": "client"
  }
}
```

**POST /login** — Connexion

```json
// Request body
{
  "email": "jean@example.com",
  "password": "Client123!"
}

// Response 200
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

---

### 2. Réservations

| Méthode | Route                          | Auth   | Description                          |
|---------|--------------------------------|--------|--------------------------------------|
| GET     | `/reservations`                | Admin  | Toutes les réservations              |
| GET     | `/my-reservations`             | Client | Ses propres réservations             |
| POST    | `/reservations`                | Client | Créer une réservation                |
| PUT     | `/reservations/:id`            | Client | Modifier (si status = pending)       |
| DELETE  | `/reservations/:id`            | Client | Annuler une réservation              |
| PATCH   | `/reservations/:id/validate`   | Admin  | Confirmer une réservation            |

**POST /reservations** — Créer une réservation

```json
// Request body
// Header: Authorization: Bearer <token>
{
  "number_of_people": 5,
  "date": "2026-06-20",
  "time": "20:00",
  "note": "Anniversaire, si possible près de la fenêtre"
}

// Response 201
{
  "message": "Réservation créée avec succès",
  "reservation": {
    "id": 1,
    "user_id": 3,
    "number_of_people": 5,
    "date": "2026-06-20",
    "time": "20:00",
    "status": "pending",
    "note": "Anniversaire, si possible près de la fenêtre",
    "tables": [
      { "id": 2, "seats": 4 },
      { "id": 5, "seats": 2 }
    ]
  }
}
```

**PUT /reservations/:id** — Modifier une réservation

```json
// Request body
{
  "number_of_people": 3,
  "date": "2026-06-21",
  "time": "19:00"
}

// Response 200
{
  "message": "Réservation modifiée avec succès",
  "reservation": { "..." }
}

// Response 403 (si déjà confirmée)
{
  "error": "Impossible de modifier une réservation confirmée"
}
```

**PATCH /reservations/:id/validate** — Confirmer (admin)

```json
// Response 200
{
  "message": "Réservation confirmée",
  "reservation": {
    "id": 1,
    "status": "confirmed"
  }
}
```

**DELETE /reservations/:id** — Annuler

```json
// Response 200
{
  "message": "Réservation annulée",
  "reservation": {
    "id": 1,
    "status": "cancelled"
  }
}
```

**Statuts possibles d'une réservation :**
- `pending` — en attente (par défaut à la création)
- `confirmed` — confirmée par un admin
- `cancelled` — annulée par le client ou l'admin

---

### 3. Menu

| Méthode | Route        | Auth  | Description              |
|---------|--------------|-------|--------------------------|
| GET     | `/menu`      | ❌    | Consulter le menu        |
| POST    | `/menu`      | Admin | Ajouter un plat          |
| PUT     | `/menu/:id`  | Admin | Modifier un plat         |
| DELETE  | `/menu/:id`  | Admin | Supprimer un plat        |

**GET /menu** — Consulter le menu

```json
// Response 200
{
  "menu": [
    {
      "category": "Entrées",
      "items": [
        {
          "id": 1,
          "name": "Soupe à l'oignon",
          "description": "Soupe gratinée traditionnelle",
          "price": 8.50,
          "category": "Entrées"
        }
      ]
    },
    {
      "category": "Plats",
      "items": []
    },
    {
      "category": "Desserts",
      "items": []
    },
    {
      "category": "Boissons",
      "items": []
    }
  ]
}
```

**GET /menu?category=desserts&max_price=15** — Filtrer le menu

```json
// Response 200
{
  "items": [
    {
      "id": 8,
      "name": "Crème brûlée",
      "description": "Crème vanille caramélisée",
      "price": 9.00,
      "category": "Desserts"
    }
  ]
}
```

---

### 4. Tables (Admin)

| Méthode | Route         | Auth  | Description               |
|---------|---------------|-------|---------------------------|
| GET     | `/tables`     | Admin | Liste des tables          |
| POST    | `/tables`     | Admin | Ajouter une table         |
| PUT     | `/tables/:id` | Admin | Modifier une table        |
| DELETE  | `/tables/:id` | Admin | Supprimer une table       |

---

### 5. Disponibilité & Créneaux (Bonus)

| Méthode | Route                           | Auth  | Description                           |
|---------|---------------------------------|-------|---------------------------------------|
| GET     | `/availability?date=2026-06-20` | ❌    | Créneaux disponibles à une date       |
| POST    | `/opening-slots`                | Admin | Ajouter un créneau                    |
| DELETE  | `/opening-slots/:id`            | Admin | Supprimer un créneau                  |

---

## 🔒 Authentification

Toutes les routes protégées nécessitent un header `Authorization` :

```
Authorization: Bearer <votre_token_jwt>
```

Le token est obtenu via `POST /login`.

---

## ❌ Gestion des erreurs

L'API retourne des codes HTTP cohérents :

| Code | Signification                                              |
|------|------------------------------------------------------------|
| 200  | Succès                                                     |
| 201  | Ressource créée                                            |
| 400  | Requête invalide (champs manquants, données incorrectes)   |
| 401  | Non authentifié (token manquant ou invalide)               |
| 403  | Accès interdit (rôle insuffisant)                          |
| 404  | Ressource non trouvée                                      |
| 409  | Conflit (créneau indisponible, email déjà utilisé)         |
| 500  | Erreur serveur                                             |

Format standard des erreurs :

```json
{
  "error": "Description de l'erreur"
}
```

---

## 🗄️ Base de données

### Schéma des tables

- **users** — id, email, password_hash, fname, lname, phone, role
- **reservations** — id, user_id, number_of_people, date, time, status, note
- **tables** — id, seats
- **reservation_tables** — reservation_id, table_id
- **menu_items** — id, name, description, price, category, image
- **opening_slots** — id, day_of_week, time, is_available, comment

Le fichier `database/init.sql` contient le script complet de création et les données de seed.

---

## 🧪 Tester l'API

1. Importer la collection Postman (si fournie) ou utiliser Thunder Client
2. Se connecter avec un compte de test via `POST /login`
3. Copier le token JWT retourné
4. Ajouter le header `Authorization: Bearer <token>` sur les routes protégées
5. Tester les différents endpoints

---

## 👥 Répartition des tâches

| Membre   | Fonctionnalités réalisées                                               |
|----------|-------------------------------------------------------------------------|
| Membre 1 | Auth (signup, login, JWT), middleware, BDD, rôles utilisateur           |
| Membre 2 | Réservations (CRUD complet), gestion des tables, logique d'attribution  |
| Membre 3 | Menu (CRUD + filtres), créneaux horaires, documentation, validation     |

---

## 📄 Licence

Projet réalisé dans le cadre d'un projet pédagogique — API avec Node.js.