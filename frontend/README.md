# Front-end React – Réservation de Restaurant

Application **React 19 / Vite** qui consomme l'API Node/Express du dossier parent (`../`). Elle permet :
- l'authentification (login / signup) avec un token JWT,
- la consultation du menu (public, avec filtres),
- la gestion des réservations côté client (créer, consulter, modifier, annuler),
- l'administration des réservations, du menu et des jours fériés côté admin.

Le style est géré avec **Bootstrap 5** (classes utilitaires + `bootstrap.bundle.min.js` pour les composants interactifs comme la navbar et les dropdowns).

## Installation

```bash
cd frontend
npm install
```

Variable d'environnement (`frontend/.env`) :

```
VITE_API_URL=http://localhost:3302/api
```

Le back-end doit tourner en parallèle (`npm run` à la racine du dépôt / `node server.js`), avec CORS activé (voir plus bas).

## Lancer le projet

```bash
npm run dev       # serveur de dev Vite (http://localhost:5173 ou port suivant si occupé)
npm run build     # build de production dans dist/
npm run preview   # sert le build de production localement
```

## Adaptation nécessaire côté back-end

Le back-end ne renvoyait pas d'en-têtes CORS. Pour que ce front (servi par Vite sur un port différent) puisse appeler l'API, `cors` a été ajouté dans `server.js` à la racine du projet (`app.use(cors())`) et la dépendance `cors` ajoutée à `package.json`. Sans ça, toutes les requêtes fetch/axios échouent silencieusement dans le navigateur (erreur CORS).

## Arborescence des composants

```
src/
├── main.jsx                      # point d'entrée : BrowserRouter + AuthProvider + import Bootstrap
├── App.jsx                       # déclaration des routes (react-router-dom)
├── index.css                     # styles custom par-dessus Bootstrap
│
├── api/                          # une fonction = un appel HTTP (axios)
│   ├── client.js                 # instance axios + interceptor Authorization: Bearer <token>
│   ├── authService.js            # login, signup
│   ├── menuService.js            # getMenu, getCategories, createMenuItem, updateMenuItem, deleteMenuItem
│   ├── reservationService.js     # createReservation, getMyReservations, updateReservation,
│   │                             # cancelReservation, getAllReservations, validateReservation
│   └── ferieService.js           # getHolidays, createHoliday, deleteHoliday
│
├── context/
│   └── AuthContext.jsx           # AuthProvider + hook useAuth() : token, user {id, role}, login, signup, logout
│
├── components/
│   ├── Navbar.jsx                # barre de navigation, liens conditionnels selon auth/role
│   ├── ProtectedRoute.jsx        # garde de route (redirige vers /login, ou /menu si role insuffisant)
│   ├── Spinner.jsx               # indicateur de chargement Bootstrap (spinner-border)
│   ├── menu/
│   │   ├── Menu.jsx              # récupère + filtre le menu (catégorie, prix max, recherche)
│   │   ├── Categorie.jsx         # affiche une catégorie et ses plats
│   │   └── Plat.jsx              # carte d'un plat (nom, description, prix)
│   └── reservations/
│       ├── ReservationForm.jsx   # formulaire controlled réutilisé par New/Edit
│       └── StatusBadge.jsx       # badge coloré selon le statut (pending/confirmed/cancelled)
│
├── pages/
│   ├── HomePage.jsx              # accueil public
│   ├── LoginPage.jsx             # /login
│   ├── SignupPage.jsx            # /signup
│   ├── MenuPage.jsx              # /menu
│   ├── MyReservationsPage.jsx    # /my-reservations (client)
│   ├── NewReservationPage.jsx    # /reservations/new (client)
│   ├── EditReservationPage.jsx   # /reservations/:id/edit (client)
│   ├── AdminReservationsPage.jsx # /reservations (admin) : filtres + validation/annulation
│   ├── AdminMenuPage.jsx         # /admin/menu (admin) : CRUD plats
│   ├── AdminHolidaysPage.jsx     # /admin/holidays (admin) : ajout/suppression jours fériés
│   └── NotFoundPage.jsx          # 404
│
└── utils/
    ├── jwt.js                    # decodeToken (base64), isTokenExpired
    ├── format.js                 # formatDate, toDateInputValue, toTimeInputValue
    └── openingSlots.js           # créneaux d'ouverture par jour (dupliqués du seed SQL, voir limites)
```

## Routes front-end

| Route                     | Accès           | Description                                             |
|----------------------------|-----------------|----------------------------------------------------------|
| `/`                        | Public          | Page d'accueil                                           |
| `/login`                   | Public          | Connexion                                                 |
| `/signup`                  | Public          | Inscription                                               |
| `/menu`                    | Public          | Menu filtrable (catégorie, prix max, recherche)           |
| `/my-reservations`         | Authentifié     | Réservations du client connecté (modifier/annuler)        |
| `/reservations/new`        | Authentifié     | Créer une réservation                                     |
| `/reservations/:id/edit`   | Authentifié     | Modifier une réservation existante                        |
| `/reservations`            | Admin           | Tableau de toutes les réservations, filtres, valider/annuler |
| `/admin/menu`              | Admin           | CRUD des plats du menu                                     |
| `/admin/holidays`          | Admin           | Ajout / suppression de jours fériés                        |
| `*`                        | Public          | 404                                                        |

La protection est assurée par `ProtectedRoute` (redirection vers `/login` si non authentifié, vers `/menu` si authentifié mais pas admin sur une route `requireAdmin`).

## Endpoints API consommés

| Frontend (`api/*Service.js`)     | Méthode | Endpoint                              | Auth         |
|-----------------------------------|---------|-----------------------------------------|--------------|
| `authService.login`               | POST    | `/auth/login`                           | Public       |
| `authService.signup`              | POST    | `/auth/signup`                          | Public       |
| `menuService.getMenu`             | GET     | `/menu?category=&max_price=`            | Public       |
| `menuService.getCategories`       | GET     | `/menu/categories`                      | Public       |
| `menuService.createMenuItem`      | POST    | `/menu/create`                          | Admin        |
| `menuService.updateMenuItem`      | PUT     | `/menu/:id`                             | Admin        |
| `menuService.deleteMenuItem`      | DELETE  | `/menu/:id`                             | Admin        |
| `reservationService.createReservation` | POST | `/reservations/create`               | Authentifié  |
| `reservationService.getMyReservations` | GET  | `/reservations/my-reservations`      | Authentifié  |
| `reservationService.updateReservation` | PUT  | `/reservations/:id`                  | Authentifié  |
| `reservationService.cancelReservation` | DELETE | `/reservations/:id`                | Authentifié (admin = toutes, client = les siennes) |
| `reservationService.getAllReservations` | GET | `/reservations?date=&status=&sort=`  | Admin        |
| `reservationService.validateReservation` | PATCH | `/reservations/:id/validate`       | Admin        |
| `ferieService.getHolidays`        | GET     | `/ferie`                                | Authentifié  |
| `ferieService.createHoliday`      | POST    | `/ferie/create`                         | Admin        |
| `ferieService.deleteHoliday`      | DELETE  | `/ferie/:date`                          | Admin        |

`menu/categories`, `menu/create`, `menu/:id` (PUT/DELETE) sont de **nouvelles routes ajoutées côté back** (`routes/menuRoutes.js`) pour permettre l'administration du menu, qui n'existait pas dans l'API d'origine.

## Authentification (AuthContext)

- Le back-end ne renvoie qu'un `token` au login (pas d'objet `user`). Le rôle (`client`/`admin`) et l'id utilisateur sont donc extraits en décodant le payload du JWT côté client (`utils/jwt.js`), sans bibliothèque externe.
- Le token est stocké dans `localStorage` et automatiquement rattaché à chaque requête privée via un intercepteur axios (`api/client.js` : `Authorization: Bearer <token>`).
- `AuthContext` expose `isAuthenticated`, `isAdmin`, `user`, `login()`, `signup()` (qui enchaîne un login automatique après l'inscription, car `/auth/signup` ne renvoie pas de token), `logout()`.

## Adaptations par rapport à l'énoncé du PDF

- Le formulaire de réservation ne demande pas *name*/*phone* : l'API associe la réservation à l'utilisateur connecté (`user_id` du token) et le nom/téléphone sont déjà en base (table `users`) ; les redemander n'aurait eu nulle part où être stockés côté réservation.
- Pas de route `GET /availability?date=` côté API : les créneaux horaires proposés dans le formulaire sont dérivés d'une table statique (`utils/openingSlots.js`) reflétant `opening_slots` en base (le nombre réel de places restantes n'est vérifié que côté serveur, au moment de la soumission).
- Les noms de routes (`/reservations/create`, `/reservations/my-reservations`, etc.) suivent ceux déjà définis dans l'API existante plutôt que ceux suggérés dans le PDF.

## Fonctionnalités bonus implémentées (Partie 2 du PDF)

1. **Routing et protection de routes** (React Router + `ProtectedRoute`, redirection si non connecté / rôle insuffisant).
2. **Gestion globale du token** (`AuthContext`).
3. **Filtres et recherche** : sur `/menu` (catégorie, prix max via les query params de l'API, recherche texte côté client) et sur `/reservations` admin (date, statut, tri).
4. **Animations de chargement** : composant `Spinner` affiché pendant tous les appels réseau (`isLoading`).

## Bugs corrigés pendant les tests (back-end)

En testant le front, deux bugs de l'API ont été mis en évidence et corrigés :

1. **Vérification des jours fériés silencieusement inopérante.** Les routes construisaient un objet `Date` JS à partir d'une chaîne `YYYY-MM-DD` (`new Date(req.body.date)`), puis le passaient tel quel comme paramètre SQL. `mysql2` sérialise un `Date` avec les *getters locaux* (fuseau du serveur), ce qui ajoutait une heure non nulle (ex. `02:00:00` en UTC+2) au littéral envoyé à MySQL. Une colonne `DATE` comparée à ce littéral avec heure ne matchait donc jamais (`WHERE date = ?` ne trouvait jamais le jour férié), et une réservation pouvait être créée un jour férié. Correction : le pool MySQL (`config/db.js`) utilise maintenant `dateStrings: true`, et les routes (`reservationRoutes.js`, `ferieRoutes.js`, `business/reservationManager.js`) manipulent directement la chaîne `'YYYY-MM-DD'` sans passer par `new Date(...)`. Le jour de la semaine est calculé de façon déterministe via `Utils/dateUtils.js` (parsing UTC explicite).
2. **Annulation impossible pour un admin.** `DELETE /reservations/:id` filtrait systématiquement `AND user_id = ?` avec l'id de l'appelant. Un client peut donc annuler ses propres réservations, mais un admin qui tente d'annuler la réservation d'un client obtenait toujours "Pas de réservation à cet ID." (l'id de l'admin ne correspond jamais au `user_id` de la réservation). Correction : la route ignore désormais le filtre `user_id` lorsque `req.user.role === 'admin'`.

## Limites connues

- Pas de tests automatisés front-end.
- Le formulaire de réservation ne vérifie la disponibilité réelle des places qu'à la soumission (pas de pré-vérification en temps réel faute d'endpoint `/availability`).
