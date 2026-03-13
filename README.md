# Resto API

API REST pour la gestion d'un restaurant, developpee avec **Node.js**, **Express 5** et **MySQL**.

## Description

Resto API permet de gerer :
- **Authentification** des utilisateurs (clients et admins) via JWT
- **Reservations** avec attribution automatique des tables (algorithme d'optimisation)
- **Menu** du restaurant (consultable sans compte, filtrable par categorie)
- **Jours feries** (blocage automatique des reservations)
- **Logging** des actions en base de donnees et en console

---

## Stack technique

- **Runtime :** Node.js
- **Framework :** Express.js v5
- **Base de donnees :** MySQL (mysql2/promise)
- **Authentification :** JWT (jsonwebtoken) + bcrypt
- **Validation :** express-validator
- **Variables d'environnement :** dotenv

---

## Structure du projet

```
resto-api/
├── server.js                    # Point d'entree
├── package.json
├── .env                         # Variables d'environnement (non versionne)
├── .gitignore
├── resto-api.postman_collection.json  # Collection Postman
├── config/
│   └── db.js                    # Pool de connexion MySQL
├── database/
│   └── init.sql                 # Schema + seed de la BDD
├── middlewares/
│   ├── authMiddleware.js        # Verification JWT
│   └── isAdmin.js               # Verification role admin
├── routes/
│   ├── authRoutes.js            # /api/auth    — inscription, connexion
│   ├── reservationRoutes.js     # /api/reservations — CRUD reservations
│   ├── menuRoutes.js            # /api/menu    — consultation du menu
│   └── ferieRoutes.js           # /api/ferie   — gestion des jours feries
├── business/
│   ├── reservationManager.js    # Creation de reservation en BDD
│   └── tableManager.js          # Algorithme d'assignation des tables
└── Utils/
    └── logger.js                # Logging console + BDD
```

---

## Installation

### Prerequis

- Node.js (v18+)
- MySQL (v8+)
- npm

### Etapes

```bash
# 1. Cloner le repo
git clone https://github.com/Cir0n/resto-api.git
cd resto-api

# 2. Installer les dependances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Editer le fichier .env avec vos parametres

# 4. Creer la base de donnees
# En shell (PowerShell)
Get-Content database/init.sql | mysql -u root -P <votre_port_database>
# En cmd
mysql -u root -P <votre_port_database> < database/init.sql

# 5. Lancer le serveur
node server.js
```

### Variables d'environnement (.env)

```env
# SERVER
PORT=3302

# DATABASE
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=""
DB_NAME=resto_api
DB_PORT=3306

# JWT
JWT_SECRET=votre_secret_jwt
JWT_EXPIRES_IN=1h
```

---

## Comptes de test

| Role   | Email              | Mot de passe |
|--------|--------------------|--------------|
| Admin  | admin@resto.com    | Admin123!    |
| Client | marie@example.com  | Client123!   |
| Client | jean@example.com   | Client123!   |

---

## Routes de l'API

### 1. Authentification — `/api/auth`

| Methode | Route               | Auth | Description                 |
|---------|----------------------|------|-----------------------------|
| POST    | `/api/auth/signup`   | Non  | Creer un compte utilisateur |
| POST    | `/api/auth/login`    | Non  | Connexion + retour JWT      |

**POST /api/auth/signup**

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
  "message": "User created successfully",
  "userId": 4
}
```

**POST /api/auth/login**

```json
// Request body
{
  "email": "jean@example.com",
  "password": "Client123!"
}

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
}
```

---

### 2. Reservations — `/api/reservations`

| Methode | Route                                   | Auth   | Description                     |
|---------|-----------------------------------------|--------|---------------------------------|
| POST    | `/api/reservations/create`              | Client | Creer une reservation           |
| GET     | `/api/reservations`                     | Admin  | Toutes les reservations (filtrable) |
| GET     | `/api/reservations/my-reservations`     | Client | Ses propres reservations        |
| PUT     | `/api/reservations/:id`                 | Client | Modifier une reservation        |
| DELETE  | `/api/reservations/:id`                 | Client | Annuler une reservation         |
| PATCH   | `/api/reservations/:id/validate`        | Admin  | Confirmer une reservation       |

**GET /api/reservations — Filtres disponibles (query params, Admin) :**

| Parametre | Type   | Description                                                   |
|-----------|--------|---------------------------------------------------------------|
| `date`    | string | Filtrer par date (format `YYYY-MM-DD`)                        |
| `status`  | string | Filtrer par statut (`pending`, `confirmed`, `cancelled`)      |
| `sort`    | string | Trier par champ (`date`, `status`, `number_of_people`)        |

**POST /api/reservations/create**

```json
// Request body — Header: Authorization: Bearer <token>
{
  "number_of_people": 5,
  "date": "2026-06-20",
  "time": "20:30",
  "note": "Anniversaire, si possible pres de la fenetre"
}

// Response 201
{
  "message": "Reservation confirmee",
  "reservationId": 1,
  "date": "2026-06-20",
  "slotId": 6,
  "userId": 3,
  "tables": [8, 4]
}
```

L'algorithme assigne automatiquement les tables en privilegiant les tables dont la capacite correspond au mieux au nombre de personnes. La reservation est bloquee si la date tombe sur un jour ferie.

**PUT /api/reservations/:id**

```json
// Request body
{
  "number_of_people": 3,
  "date": "2026-06-21",
  "time": "19:00",
  "note": "Changement de plan"
}

// Response 200
{
  "message": "Reservation mise a jour avec succes",
  "tables": [5]
}
```

Seules les reservations non annulees peuvent etre modifiees. Les tables sont reassignees automatiquement.

**PATCH /api/reservations/:id/validate** (Admin)

```json
// Response 200
{
  "message": "Reservation validee avec succes."
}
```

**DELETE /api/reservations/:id**

```json
// Response 200
{
  "message": "Reservation annulee avec succes"
}
```

**Statuts possibles :** `pending` (defaut) | `confirmed` (validee par admin) | `cancelled` (annulee)

---

### 3. Menu — `/api/menu`

| Methode | Route                    | Auth | Description                       |
|---------|--------------------------|------|-----------------------------------|
| GET     | `/api/menu`              | Non  | Tous les plats du menu            |

**Filtres disponibles (query params) :**

| Parametre   | Type   | Description                          |
|-------------|--------|--------------------------------------|
| `category`  | string | Filtrer par nom de categorie (ex: `entrees`, `plats`, `desserts`) |
| `max_price` | number | Filtrer par prix maximum             |

**GET /api/menu?category=plats&max_price=20**

```json
// Response 200
[
  {
    "id": 7,
    "name": "Risotto aux champignons",
    "description": "Risotto cremeux aux cepes et parmesan",
    "price": 16.00
  },
  ...
]
```

---

### 4. Jours feries — `/api/ferie`

| Methode | Route                    | Auth   | Description                    |
|---------|--------------------------|--------|--------------------------------|
| GET     | `/api/ferie`             | Client | Lister les jours feries        |
| GET     | `/api/ferie/:date`       | Client | Detail d'un jour ferie         |
| POST    | `/api/ferie/create`      | Admin  | Ajouter un jour ferie          |
| DELETE  | `/api/ferie/:date`       | Admin  | Supprimer un jour ferie        |

**POST /api/ferie/create** (Admin)

```json
// Request body
{
  "date": "2026-12-25",
  "description": "Noel"
}

// Response 201
{
  "id": 1,
  "date": "2026-12-25",
  "description": "Noel"
}
```

Les reservations sont automatiquement bloquees pour les dates marquees comme feriees.

---

## Authentification

Toutes les routes protegees necessitent un header `Authorization` :

```
Authorization: Bearer <votre_token_jwt>
```

Le token est obtenu via `POST /api/auth/login` et expire apres 1h.

---

## Gestion des erreurs

| Code | Signification                                    |
|------|--------------------------------------------------|
| 200  | Succes                                           |
| 201  | Ressource creee                                  |
| 400  | Requete invalide (champs manquants, ferie, etc.) |
| 401  | Non authentifie (token manquant)                  |
| 403  | Acces interdit (token invalide ou role insuffisant) |
| 404  | Ressource non trouvee                            |
| 409  | Conflit (email deja utilise)                      |
| 500  | Erreur serveur                                   |

Format standard :

```json
{
  "error": "Description de l'erreur"
}
```

---

## Base de donnees

### Schema

- **users** — id, email, password_hash, fname, lname, phone, role, created_at
- **tables** — id, seats, label
- **opening_slots** — id, day_of_week, time, comment (creneaux uniques par jour+heure)
- **reservations** — id, user_id, opening_slot_id, date, number_of_people, status, note, created_at, updated_at
- **reservation_tables** — reservation_id, table_id (table de liaison)
- **menu_items** — id, name, description, price, image
- **category** — id, name
- **category_menu_items** — menu_items_id, category_id (table de liaison many-to-many)
- **holidays** — id, date, description
- **logs** — id, user_id, action, details, created_at

Le fichier `database/init.sql` contient le schema complet et les donnees de seed (utilisateurs, tables, creneaux, menu).

### Tables disponibles (seed)

8 tables : 3x2 places, 3x4 places, 2x6 places — capacite totale de 30 couverts par creneau.

### Creneaux d'ouverture (seed)

| Jour      | Creneaux        |
|-----------|-----------------|
| Lundi     | 12:00, 19:00    |
| Mardi     | 12:00, 19:00    |
| Mercredi  | 13:00, 20:30    |
| Jeudi     | 13:00, 19:00    |
| Vendredi  | 12:00, 20:30    |
| Samedi    | 19:00, 21:30    |
| Dimanche  | 12:00           |

---

## Tester l'API

Une collection Postman est fournie (`resto-api.postman_collection.json`). Sinon :

1. Lancer le serveur avec `node server.js`
2. Se connecter via `POST /api/auth/login` avec un compte de test
3. Copier le token JWT retourne
4. Ajouter le header `Authorization: Bearer <token>` sur les routes protegees

---

## Licence

Projet realise dans le cadre d'un projet pedagogique.
