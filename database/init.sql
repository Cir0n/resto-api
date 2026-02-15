
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


CREATE TABLE reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    number_of_people INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    status ENUM('pending', 'confirmed', 'cancelled') DEFAULT 'pending',
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


CREATE TABLE reservation_tables (
    reservation_id INT NOT NULL,
    table_id INT NOT NULL,
    PRIMARY KEY (reservation_id, table_id),
    FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES `tables`(id) ON DELETE CASCADE
);


CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(6, 2) NOT NULL,
    category ENUM('Entrées', 'Plats', 'Desserts', 'Boissons') NOT NULL,
    image VARCHAR(255)
);


CREATE TABLE opening_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    day_of_week ENUM('lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche') NOT NULL,
    time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    comment VARCHAR(255)
);

--Les mots de passe sont des hash bcrypt round 10
INSERT INTO users (email, password_hash, fname, lname, phone, role) VALUES
('admin@resto.com',   '$2b$10$8KzQxW6Z5e0vXJZqK3m3QOe5v1f2g3h4i5j6k7l8m9n0o1p2q3r4s', 'Pierre', 'Martin', '0601020304', 'admin'),
('marie@example.com', '$2b$10$9LaRyX7A6f1wYK0rL4n4RPf6w2g4h5i6j7k8l9m0n1o2p3q4r5s6t', 'Marie', 'Durand', '0611223344', 'client'),
('jean@example.com',  '$2b$10$0MbSzY8B7g2xZL1sM5o5SQg7x3h5i6j7k8l9m0n1o2p3q4r5s6t7u', 'Jean', 'Dupont', '0622334455', 'client');


INSERT INTO `tables` (seats, label) VALUES
(2, 'Table 1'),
(2, 'Table 2'),
(2, 'Table 3'),
(4, 'Table 4'),
(4, 'Table 5'),
(4, 'Table 6'),
(6, 'Table 7'),
(6, 'Table 8');


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


INSERT INTO opening_slots (day_of_week, time, is_available) VALUES

('lundi', '12:00:00', FALSE),
('lundi', '19:00:00', FALSE),


('mardi',    '12:00:00', TRUE),
('mardi',    '13:00:00', TRUE),
('mardi',    '19:00:00', TRUE),
('mardi',    '20:30:00', TRUE),
('mercredi', '12:00:00', TRUE),
('mercredi', '13:00:00', TRUE),
('mercredi', '19:00:00', TRUE),
('mercredi', '20:30:00', TRUE),
('jeudi',    '12:00:00', TRUE),
('jeudi',    '13:00:00', TRUE),
('jeudi',    '19:00:00', TRUE),
('jeudi',    '20:30:00', TRUE),
('vendredi', '12:00:00', TRUE),
('vendredi', '13:00:00', TRUE),
('vendredi', '19:00:00', TRUE),
('vendredi', '20:30:00', TRUE),


('samedi', '19:00:00', TRUE),
('samedi', '20:30:00', TRUE),
('samedi', '21:30:00', TRUE),


('dimanche', '12:00:00', TRUE),
('dimanche', '13:00:00', TRUE);