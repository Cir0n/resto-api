const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/isAdmin');
const { logAction } = require('../Utils/logger');

router.get('/', async (req, res) => {

    const { category, max_price } = req.query;

    let query = `
        SELECT mi.id, mi.name, mi.description, mi.price
        FROM menu_items mi
        JOIN category_menu_items cmi ON cmi.menu_items_id = mi.id
        JOIN category c ON c.id = cmi.category_id
        WHERE 1=1
    `;

    const params = [];

    if (category) {
        query += " AND c.name = ?";
        params.push(category);
    }

    if (max_price) {
        query += " AND mi.price <= ?";
        params.push(max_price);
    }

    try {

        const [menuItems] = await pool.query(query, params);

        res.json(menuItems);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }
});

router.get('/categories', async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT id, name FROM category');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/create', authMiddleware, isAdmin, async (req, res) => {
    const { name, description, price, category } = req.body;
    const userId = req.user.id;

    if (typeof name !== 'string' || name.trim() === '' || price === undefined || isNaN(price)) {
        return res.status(400).json({ error: 'Nom et prix sont requis.' });
    }
    if (typeof category !== 'string' || category.trim() === '') {
        return res.status(400).json({ error: 'La catégorie est requise.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [categoryRows] = await connection.execute('SELECT id FROM category WHERE name = ?', [category]);
        if (categoryRows.length === 0) {
            const err = new Error("Catégorie introuvable.");
            err.errorCode = 400;
            throw err;
        }

        const [result] = await connection.execute(
            'INSERT INTO menu_items (name, description, price) VALUES (?, ?, ?)',
            [name, description || null, price]
        );
        const menuItemId = result.insertId;

        await connection.execute(
            'INSERT INTO category_menu_items (menu_items_id, category_id) VALUES (?, ?)',
            [menuItemId, categoryRows[0].id]
        );

        await connection.commit();
        res.status(201).json({ id: menuItemId, name, description: description || null, price, category });
        await logAction(userId, 'SUCCESSFUL_CREATION_OF_MENU_ITEM', { menuItemId }, 'INFO');
    } catch (error) {
        await connection.rollback();
        res.status(error.errorCode || 500).json({ error: error.message });
        await logAction(userId, 'FAILED_TO_CREATE_MENU_ITEM', { error: error.message }, 'ERROR');
    } finally {
        connection.release();
    }
});

router.put('/:id', authMiddleware, isAdmin, async (req, res) => {
    const menuItemId = req.params.id;
    const userId = req.user.id;
    const { name, description, price, category } = req.body;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [rows] = await connection.execute('SELECT * FROM menu_items WHERE id = ?', [menuItemId]);
        if (rows.length === 0) {
            const err = new Error("Plat introuvable pour cet ID.");
            err.errorCode = 404;
            throw err;
        }

        const updatedName = name ?? rows[0].name;
        const updatedDescription = description ?? rows[0].description;
        const updatedPrice = price ?? rows[0].price;

        await connection.execute(
            'UPDATE menu_items SET name = ?, description = ?, price = ? WHERE id = ?',
            [updatedName, updatedDescription, updatedPrice, menuItemId]
        );

        if (category) {
            const [categoryRows] = await connection.execute('SELECT id FROM category WHERE name = ?', [category]);
            if (categoryRows.length === 0) {
                const err = new Error("Catégorie introuvable.");
                err.errorCode = 400;
                throw err;
            }
            await connection.execute('DELETE FROM category_menu_items WHERE menu_items_id = ?', [menuItemId]);
            await connection.execute(
                'INSERT INTO category_menu_items (menu_items_id, category_id) VALUES (?, ?)',
                [menuItemId, categoryRows[0].id]
            );
        }

        await connection.commit();
        res.status(200).json({ message: 'Plat mis à jour avec succès' });
        await logAction(userId, 'SUCCESSFUL_UPDATE_OF_MENU_ITEM', { menuItemId }, 'INFO');
    } catch (error) {
        await connection.rollback();
        res.status(error.errorCode || 500).json({ error: error.message });
        await logAction(userId, 'FAILED_TO_UPDATE_MENU_ITEM', { error: error.message, menuItemId }, 'ERROR');
    } finally {
        connection.release();
    }
});

router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
    const menuItemId = req.params.id;
    const userId = req.user.id;
    try {
        const [result] = await pool.query('DELETE FROM menu_items WHERE id = ?', [menuItemId]);
        if (result.affectedRows === 0) {
            const err = new Error("Plat introuvable pour cet ID.");
            err.errorCode = 404;
            throw err;
        }
        res.status(200).json({ message: 'Plat supprimé avec succès' });
        await logAction(userId, 'SUCCESSFUL_DELETION_OF_MENU_ITEM', { menuItemId }, 'INFO');
    } catch (error) {
        res.status(error.errorCode || 500).json({ error: error.message });
        await logAction(userId, 'FAILED_TO_DELETE_MENU_ITEM', { error: error.message, menuItemId }, 'ERROR');
    }
});

module.exports = router;
