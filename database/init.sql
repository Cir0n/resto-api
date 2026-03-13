DROP DATABASE IF EXISTS resto_api;
CREATE DATABASE resto_api CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE resto_api;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    fname VARCHAR(100) NOT NULL,
    lname VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role ENUM('client', 'admin') DEFAULT 'client',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE `tables` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seats INT NOT NULL,
    label VARCHAR(50)
);

CREATE TABLE opening_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week ENUM('dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi') NOT NULL,
    time TIME NOT NULL,
    comment VARCHAR(255),
    UNIQUE KEY uq_slot (day_of_week, time)   -- empêche les doublons de créneaux
);

CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    opening_slot_id INT NOT NULL,
    date DATE NOT NULL,
    number_of_people INT NOT NULL,
    status ENUM('pending','confirmed','cancelled') DEFAULT 'pending',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)        REFERENCES users(id)         ON DELETE CASCADE,
    FOREIGN KEY (opening_slot_id) REFERENCES opening_slots(id) ON DELETE RESTRICT
);

DROP TABLE IF EXISTS reservation_tables;

CREATE TABLE reservation_tables (
    reservation_id INT NOT NULL,
    table_id INT NOT NULL,
    PRIMARY KEY (reservation_id, table_id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id)       REFERENCES `tables`(id)     ON DELETE CASCADE
);

CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(6,2) NOT NULL,
    category ENUM('Entrées','Plats','Desserts','Boissons') NOT NULL,
    image VARCHAR(255)
);

CREATE TABLE category_menu_items (
    menu_items_id INT NOT NULL,
    category_id INT NOT NULL,
    PRIMARY KEY (menu_items_id, category_id),
    FOREIGN KEY (menu_items_id) REFERENCES menu_items(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id)       REFERENCES `category`(id)     ON DELETE CASCADE
);

CREATE TABLE `category` (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50)
);


INSERT INTO resto_api.category
( name)
VALUES('entrées'),
('plats'),
('desserts');


INSERT INTO resto_api.category_menu_items
(menu_items_id, category_id)
VALUES(1, 1),
(2, 1),
(3, 1),
(4, 1),
(5, 1),
(6, 1),
(7, 2),
(8, 2),
(9, 2),
(10, 2),
(11, 2),
(12, 3),
(13, 3),
(14, 3),
(15, 3),
(16, 3),
(17, 3),
(18, 3);


-- Mots de passe : hash bcrypt round 10
INSERT INTO users (email, password_hash, fname, lname, phone, role) VALUES
('admin@resto.com',   '$2b$10$KeEchWQm9VX.Szgxk.zgpeKrcmJQ1SWN.PJznDqGEza3U3CNI2nWa', 'Pierre', 'Martin', '0601020304', 'admin'),
('marie@example.com', '$2b$10$iHaUYFHckoMb9vghC/gap.DGPU70/QpCxe9n9Q0Ghmv/.NNBU3MWa', 'Marie',  'Durand', '0611223344', 'client'),
('jean@example.com',  '$2b$10$iHaUYFHckoMb9vghC/gap.DGPU70/QpCxe9n9Q0Ghmv/.NNBU3MWa', 'Jean',   'Dupont', '0622334455', 'client');

INSERT INTO `tables` (seats, label) VALUES
(2, 'Table 1'),
(2, 'Table 2'),
(2, 'Table 3'),
(4, 'Table 4'),
(4, 'Table 5'),
(4, 'Table 6'),
(6, 'Table 7'),
(6, 'Table 8');

INSERT INTO opening_slots (day_of_week, time) VALUES
('lundi',    '12:00:00'),
('lundi',    '19:00:00'),
('mardi',    '12:00:00'),
('mardi',    '19:00:00'),
('mercredi', '13:00:00'),
('mercredi', '20:30:00'),
('jeudi',    '13:00:00'),
('jeudi',    '19:00:00'),
('vendredi', '12:00:00'),
('vendredi', '20:30:00'),
('samedi',   '19:00:00'),
('samedi',   '21:30:00'),
('dimanche', '12:00:00');

INSERT INTO menu_items (name, description, price, category) VALUES
('Soupe à l\'oignon',       'Soupe gratinée traditionnelle au fromage',          8.50,  'Entrées'),
('Salade César',             'Salade romaine, poulet grillé, parmesan, croûtons', 10.00, 'Entrées'),
('Terrine de campagne',      'Terrine maison servie avec cornichons et pain',     9.00,  'Entrées'),
('Œuf cocotte',              'Œuf cocotte à la crème et aux champignons',         8.00,  'Entrées'),
('Entrecôte grillée',        'Entrecôte 300g, frites maison et salade verte',    22.00, 'Plats'),
('Filet de saumon',          'Saumon rôti, purée de patates douces et légumes',  19.50, 'Plats'),
('Risotto aux champignons',  'Risotto crémeux aux cèpes et parmesan',            16.00, 'Plats'),
('Burger maison',            'Steak haché, cheddar, bacon, sauce secrète',       15.00, 'Plats'),
('Confit de canard',         'Cuisse de canard confite, pommes sarladaises',     20.00, 'Plats'),
('Crème brûlée',             'Crème vanille caramélisée au chalumeau',            9.00,  'Desserts'),
('Fondant au chocolat',      'Cœur coulant au chocolat noir 70%',                10.00, 'Desserts'),
('Tarte tatin',              'Tarte aux pommes caramélisées, crème fraîche',      9.50,  'Desserts'),
('Mousse au chocolat',       'Mousse légère au chocolat noir maison',             8.00,  'Desserts'),
('Eau minérale (50cl)',      'Evian ou Badoit',                                   3.50,  'Boissons'),
('Coca-Cola',                'Coca-Cola classique 33cl',                           4.00,  'Boissons'),
('Jus d\'orange frais',      'Orange pressée minute',                             5.00,  'Boissons'),
('Café expresso',            'Café arabica serré',                                2.50,  'Boissons'),
('Thé parfumé',              'Sélection de thés : Earl Grey, menthe, jasmin',     3.50,  'Boissons');

CREATE TABLE logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);